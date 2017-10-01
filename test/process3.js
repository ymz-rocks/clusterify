
process.on('message', function(value)
{
    process.send(value + 3);
});