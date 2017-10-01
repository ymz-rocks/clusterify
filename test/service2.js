
module.exports = 
{
    ctx: 
    {
        "service": "#2"
    },

    run: function(require, worker)
    {
        function message(value)
        {
            ctx.value = value; console.log(ctx);

            group.pop(); 
            
            if (group.length == 0)
            {
                worker.kill();
            }
        }

        var ctx = this,
            fork = require('child_process').fork,
            group = new Array(3),
            value = 100;
  
        group.fill('./test/process');

        group.forEach(function(path, index)
        {
            var process = fork(path + (index + 1));

            process.on('message', message);
            process.send(value++);
        });

        this.event = 'run';
    },

    on:
    {
        start: function(worker)
        {
            this.event = 'start'; console.log(this);

            return true;
        },

        stop: function(worker, code, signal)
        {
            this.event = 'stop'; console.log(this);

            return true;
        }
    }
};