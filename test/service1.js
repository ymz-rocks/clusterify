module.exports = 
{
    ctx: 
    {
        "service": "#1",
        "time": new Date().getTime()
    },

    run: function(require, worker, done)
    {
        this.event = 'run'; console.log(this);

        setTimeout(function() { worker.kill(); }, 1000);
    },

    on:
    {
        start: function(worker)
        {
            this.event = 'start'; console.log(this);

            return true; // true -> proceed, false -> terminate
        },

        stop: function(worker, code, signal)
        {
            var diff = new Date().getTime() - this.time,
                exit = diff > 2000;

            this.event = 'stop'; console.log(this);

            return exit; // true -> exit, false -> restart service
        }
    }
};