var node =
{
    cluster: require('cluster')

}, nothing = function() {};

function exec(worker)
{
    function build(func)
    {
        return new Function('(' + func + ').apply(this, arguments)')
    }

    var handler;

    unsafe(function()
    {
        handler = 
        {
            ctx: JSON.parse(worker.process.env.clusterify_ctx),

            on:
            {
                error: build(worker.process.env.clusterify_error || nothing),
                notify: build(worker.process.env.clusterify_notify || nothing)
            },

            run: build(worker.process.env.clusterify_run)
        };

        handler.ctx.pid = process.pid;

    }, console.error);

    unsafe(function()
    {
        if (handler.on.notify)
        {
            worker.on('message', function(message)
            {
                handler.on.notify.call(handler.ctx, worker, message);
            });
        }

        handler.run.call(handler.ctx, require, worker);

    }, function(ex, worker)
    {
        handler.on.error.call(handler.ctx, ex, worker);
    });
}

function unsafe(process, fail, ctx)
{
    try
    {
        var message = process();

        if (message) fail(new Error(message));
    }
    catch(ex)
    {
        fail(ex, node.cluster.worker);
    }
}

if (node.cluster.isWorker) 
{
    module.exports = undefined;

    return exec(node.cluster.worker);
}

node.fs = require('fs');
node.os = require('os');

function Services()
{
    this.notify = function(workers, message)
    {
        workers.forEach(function(worker)
        {
            worker.send(message);
        });
    };

    this.select = function()
    {
        var workers = [];

        for (var i in arguments)
        {
            (function(worker)
            {
                if (worker) workers.push(worker);

            })(node.cluster.workers[arguments[i]]);
        }

        return workers;
    };
}

function Clusterify(config, on)
{
    function contextify(then)
    {
        var ctx = this,
            events = [ 'batch', 'end', 'fail', 'interrupt', 'ready' ];

        if (!on) on = {}

        for (var i = 0; i < events.length; i++)
        {
            if (on[events[i]] instanceof Function) continue;

            on[events[i]] = nothing;
        }

        node.fs.readFile(config, 'utf8', function(error, data)
        {
            if (error) return on.fail(error);

            unsafe(function()
            {
                ctx.config = JSON.parse(data) || {};
                
                if (ctx.config.services instanceof Array)
                {
                    then(ctx);
                }
                else return 'invalid configuration format';

            }, on.fail)
        });
    }

    function init()
    {
        var ctx = this;

        register('online', 'start');
        register('exit', 'stop', worker, function()
        {
            if (Object.keys(node.cluster.workers).length == 0) 
            {
                alive = !on.end(); 
                
                if (alive)
                {
                    process.stdin.resume(); 
                    refresh.call(ctx);
                }
            }
        });

        this.select = function()
        {
            var workers = services.select.apply(this, arguments);

            return { 
                
                notify: function(message)
                {
                    services.notify(workers, message);
                }
            };
        };

        var interrupt = on.interrupt;

        on.interrupt = function()
        {   
            if (alive) interrupt.call(ctx, arguments);
        };

        process.on('exit', on.interrupt);
        process.on('SIGINT', on.interrupt);
        process.on('uncaughtException', on.interrupt);
    }

    function refresh()
    {
        contextify.call(this, function(ctx)
        {
            if (on.batch(ctx, node.os))
            {
                ctx.config.services.forEach(function(config)
                {
                    worker(config[0]);
                });
            }

            on.ready(ctx);
        });
    }

    function register(name, alias, valid, invalid)
    {
        node.cluster.on(name, function(worker) 
        {
            var args = arguments;

            unsafe(function()
            {
                var handler = workers[worker.process.pid]; if (!handler.on[alias]) return;
                
                handler.ctx.pid = worker.process.pid;

                var result = handler.on[alias].apply(handler.ctx, args),
                    proceed = alias === 'stop' ? !result : result;

                if (proceed)
                {
                    if (valid) valid(handler.path);
                }
                else
                {
                    if (invalid) invalid();
                }
            }, on.fail);
        });
    }

    function run(id, done)
    {
        var index = parseInt(id);

        if (isNaN(index))
        {
            for (var i = 0; i < this.config.services.length; i++)
            {
                if (this.config.services[i][1] == id)
                {
                    index = i; break;
                }
            }
        }
        else index--;

        var config = this.config.services[index];

        if (config) worker(config[0], done);
    };

    function worker(path, done)
    {
        unsafe(function()
        {
            var handler = Object.assign({ path: path }, require(path));

            handler.ctx = handler.ctx || {};
            handler.on = handler.on || {};

            var worker = node.cluster.fork
            ({ 
                clusterify_ctx: JSON.stringify(handler.ctx),
                clusterify_error: handler.on.error ? handler.on.error.toString() : '',
                clusterify_notify: handler.on.notify ? handler.on.notify.toString() : '',
                clusterify_run: handler.run ? handler.run.toString() : ''
            });

            workers[worker.process.pid] = handler;

            if (done instanceof Function) done(worker.id);

        }, on.fail);
    }

    if (!node.cluster.isMaster) return;
    
    var alive = true, services = new Services(), workers = {};

    init.call(this);
    refresh.call(this);

    this.run = run;
}

module.exports = function(config, on)
{
    return new Clusterify(config, on);
}