module.exports = 
{
    ctx: 
    {
        "service": "#3"
    },

    run: function(require, worker, done)
    {
        this.event = 'run'; console.log(this);

        throw new Error('really?')
    },

    on:
    {
        start: function(worker)
        {
            this.event = 'start'; console.log(this);

            return true;
        },

        error: function(handler, worker, ctx)
        {
            this.critical = handler; console.log(this);

            worker.kill();
        },

        stop: function(worker, code, signal)
        {
            this.event = 'stop'; console.log(this);

            return true;
        }
    }
};