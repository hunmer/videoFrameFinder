const fs = require('fs');
const path = require('path');
const files = require('./file.js');
const { getDuplicateImages } = require('./main.js')

// function sendMsg(client, msg) {
//     if (typeof (msg) == 'object') msg = JSON.stringify(msg);
//     client.send(msg);
// }

// var WebSocketServer = require('ws').Server;
// var wss = new WebSocketServer({ port: 1081 });
// wss.on('connection', function connection(ws) {
//     ws.on('message', function incoming(msg) {
//         var data = JSON.parse(msg);
//         console.log(data);
//         switch (data.type) {

//         }
//     })
// });

// function broadcastMsg(msg) {
//     if (typeof (msg) == 'object') msg = JSON.stringify(msg);
//     wss.clients.forEach(function each(client) {
//         client.send(msg);
//     });
// }

// var g_list = {};
// if (fs.existsSync('list.json')) {
//     g_list = JSON.parse(fs.readFileSync('list.json'));
// }

var port = 1081;
const express = require('express');
const app = express();
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

let bodyParser = require('body-parser');
let formidable = require('formidable');
app.use(bodyParser.urlencoded({ extended: false }));

function registerApi(url, type, callback) {
    app[type](url, callback);
}

function echoJson(res, data) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

registerApi('/', 'get', (req, res) => {
    res.sendFile(__dirname + '/web/index.html');
});
registerApi('/search', 'post',  async function(req, res){
    var d = req.body;
    if(d.img && d.database){
         if(!fs.existsSync('./dbs/'+d.database+'.db')){
               return echoJson(res, { msg: '数据库不存在!' });
            }
        var bin = new Buffer.from(d.img.replace(/^data:image\/\w+;base64,/, ""), 'base64');
         var ret = await getDuplicateImages(d.database, bin);
          echoJson(res, { msg: '查询成功', data: ret });
    }else{
         echoJson(res, { msg: '参数错误!' });
    }
});

registerApi('/list', 'get', (req, res) => {
      var list = [];
      files.searchDirFiles(__dirname+'/dbs/', list, ['db'], 2);
      for(var i=0;i<list.length;i++){
        list[i] = path.basename(list[i]);
      }
    echoJson(res, {list: list});
});
registerApi('/upload', 'post', (req, res) => {
    var form = formidable({
        uploadDir: __dirname
    });
    form.parse(req, function(err, fields, files) {
        var data = files.fileUpload;
        if(data){
            if(path.extname(data.originalFilename) != '.db'){
                return echoJson(res, { msg: '非法的db文件' });
            }
            // todo 试着打开DB
            if(fs.existsSync('./dbs/'+data.originalFilename)){
                echoJson(res, { msg: '文件已经存在!' });
            }else{
                fs.rename(data.filepath, './dbs/' + data.originalFilename, function(err) {
                    if (err) throw err;
                    echoJson(res, { msg: '上传成功!' });
                });
            }
            return;
        }
         echoJson(res, { msg: '上传失败!' });
    });
});


app.listen(port);
console.log('HTTPServer running at http://127.0.0.1:' + port + '/');