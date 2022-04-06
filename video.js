#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const files = require('./file.js');
var spawn = require("child_process").spawn;
const iconvLite = require('iconv-lite');
const { setLog } = require('./log.js');

function runCmd(cmd, callback, onClose) {
    // console.log(cmd);
    return new Promise(function(resolve, reject) {
        var result = spawn('cmd.exe ', ['/s', '/c', cmd], { shell: true });
        result.on('close', function(code) {
            if (typeof(onClose) == 'function') onClose(code);
        });
        result.stdout.on('data', function(data) {
            callback(iconvLite.decode(data, 'cp936'));
        });
        resolve();

    });
}


function replaceAll_once(str, search, replace, start = 0) {
    while (true) {
        var i = str.indexOf(search, start);
        if (i == -1) break;
        start = i + search.length;
        str = str.substr(0, i) + replace + str.substr(start, str.length - start);
        start += replace.length - search.length;

    }
    return str;
}
// C:\Users\31540\Downloads\Video\天道
function scanVideos(db, list, onDone, onProgress, opts) {
    const { getParams } = require('./index.js');
    if(getParams('skip')){
        opts.db = db;
    }
    const { importImage } = require('./main.js');
    if (Array.isArray(list) && list.length) {
        for(var file of list){
            if(files.isDir(file)){
                list.splice(list.indexOf(file), 1);
                var listFile = [];
                files.searchDirFiles(file, listFile, ['mp4', 'ts', 'avi', 'mkv'], 2);
                list = list.concat(listFile);
            }
        }
        if(list.length){
            console.log(chalk.yellow(`导入${list.length}个视频中...`));
            var done = 0;
            const fun = (index) => {
                onProgress && onProgress(list[index]);
                parseVideo( list[index], (img) => {
                    if (img == undefined) {
                        done++;
                        if (done == list.length) {
                            onDone();
                        } else {
                            fun(done);
                        }
                        return;
                    }
                    importImage(db, img);
                }, opts);
            }
            var current = 0;
            var max = Math.min(list.length, 5);
            for (var i = 0; i < max; i++) {
                fun(i);
            }
        }
        return;
    }
     onDone();
}

function parseVideo(file, callback,opts ) {
    if(typeof(file) != 'string') return;
    if(!opts) opts = {};
    Object.assign(opts, {pre: 2.5});
    // file = file.replace('\\', '/');
    var name = path.basename(file, path.extname(file));
    setLog(file, { text: file + ' -> 获取视频时长中...', color: 'white' });
    var dir = replaceAll_once(__dirname, '\\', '\/');
    var exe = dir + '\/bin\/ffprobe.exe';
    runCmd(`${exe} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`, (output) => {
        var duration = parseInt(output);
        if (duration) {
            var pre = parseInt(opts.pre);
            var max = Math.ceil(duration / pre);
            var done = 0;
            var progress_old = 0;
            var progress = 0;

            const next = () => {
                 progress = parseInt(++done / max * 100);
                if (progress != progress_old) {
                    progress_old = progress;
                    // setShowing(`${prefix}获取视频图片中... ${progress}%`);
                    if (progress == 100) {
                        setLog(file, { text: name + ' -> 处理完毕', color: 'yellow' }, 'succeed');
                        return callback();
                    }
                    setLog(file, { text: name + ' -> ' +progress + '%', color: 'white' });
                }
                fun(done);
            }
            const fun = (i) => {
                var s = i * pre;
                var fileName = `[${getTime(s)}]${name}`;
                var img = __dirname + `/img/${fileName}.jpg`;
                // todo 如果文件存在于数据库中则跳过
                if(opts.db){
                     if(opts.db.prepare('SELECT id FROM pics WHERE name=?').get(fileName)){
                        return next();
                     }
                }
                var exe = dir + '\/bin\/ffmpeg.exe';
                var cmd = `${exe} -ss ${s} -y -i "${file}" -frames:v 1 "${img}"`;
                runCmd(cmd, (output) => {}, () => {
                    if (fs.existsSync(img)) {
                        callback(img);
                    }
                   next();
                });
            }
            fun(0);
        }
    });
}


function getTime(s, sh = '时', sm = '分', ss = '秒') {
    var h = 0,
        m = 0;
    if (s >= 3600) {
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if (s >= 60) {
        m = parseInt(s / 60);
        s %= 60;
    }
    return h + sh + m + sm + parseInt(s) + ss;
}

module.exports = {
    parseVideo,
    scanVideos
};