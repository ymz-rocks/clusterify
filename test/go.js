var clusterify = require('../clusterify');

if (clusterify) clusterify('./test/config.json', 
{
    batch: function(ctx, os)
    {
        console.log('\nTotal Cores: ' + os.cpus().length + '\n');

        return true; // true -> execute services, by order
    },

    ready: function(ctx)
    {
        ctx.run('test4', function(workerId)
        {
            ctx.select(4, workerId).notify('hello');
        });
    },

    fail: console.log,

    end: function()
    {
        console.log('\nThis is the end... bye bye\n');

        return true; // true -> terminate and exit, false -> restart endlessly
    },

    interrupt: function(error)
    {
        console.log('\nFatal error! I will survive...\n')
        console.log(error);
    }
});





