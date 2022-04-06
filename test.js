const { setLog, stopAllLog } = require('./log.js');

setLog('a', {
  text: 'C:\\dev\\e\\videoFrameFinder\\src\\img\\[0时0分0秒]天道-11.jpg',
  color: 'success'
});
setLog('b', {text: 'bb'});
setTimeout(() => {
		setInterval(() => {
		setLog('b', {text: new Date().getTime()});
	}, 100);
}, 1000);

// setTimeout(() => {
// 	stopAllLog()
// }, 3000);