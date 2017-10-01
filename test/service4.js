module.exports = 
{
    ctx: 
    {
        "service": "#4"
    },

    run: function(require, worker, done)
    {
        this.event = 'run'; console.log(this);
    },

    on:
    {
        start: function(worker)
        {
            this.event = 'start'; console.log(this);

            return true;
        },

        notify: function(worker, message)
        {
            this.event = 'notify'; 
            this.message = message;
            
            console.log(this);

            worker.kill();
        },

        stop: function(worker, code, signal)
        {
            this.event = 'stop'; console.log(this);

            return true;
        }
    }
};