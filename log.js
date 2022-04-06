const Spinners = require('spinnies');
var listKey = [];
var spinner = new Spinners({
  spinner:  { 
    "interval": 50,
    "frames": ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
   },
   // disableSpins: true,
  //color: 'blue',
  succeedColor: 'green',
  failColor: 'red',
  spinnerColor: 'blueBright'
});

function setLog(key, opts, method) {
    // return console.log(text);
    var stop = opts == undefined;
    if(!listKey.includes(key)){
        if(stop || method != undefined) return;
        method = 'add';
        listKey.push(key);
    }else{
        if(stop) return stopLog(key);
        if(!method) method = 'update';
    }
    spinner[method](key, opts);
}

function stopLog(key){
    if(key == undefined) return stopAllLog();
    var i = listKey.indexOf(key);
    if(i != -1){
        spinner.remove(key);
        listKey.splice(i, 1);
    }
}

function stopAllLog(status){
   spinner.stopAll(status);
}

module.exports = {
    setLog,
    stopAllLog
};