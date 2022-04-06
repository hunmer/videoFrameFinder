const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const images = require("images");
const webp = require('webp-converter');
const files = require("./file.js");
const blockhash = require("blockhash-core");
const { imageFromBuffer, getImageData } = require("@canvas/image");
const { parseVideo, scanVideos } = require("./video.js");
const { setLog, stopAllLog } = require('./log.js');

const imgFolder = "\\img\\";
const videoFolder = "\\video\\";

async function importImage(db, file) {
    // console.log('->' + file);
    const imgHash = await hash(file);
    const title = path.basename(file, path.extname(file));
    const row = db.prepare('SELECT name FROM pics WHERE hash=?').get(imgHash);
    if (!row) {
        db.prepare('INSERT INTO pics (hash,name) VALUES (@hash, @name)').run({ hash: imgHash, name: title });
        let result = await webp.buffer2webpbuffer(images(file).resize(120).encode("jpg", { operation: 25 }, "jpg", "-q 80"));
        db_thumb.prepare('INSERT INTO pics (hash, pic) VALUES (@hash, @pic)').run({ hash: imgHash, pic: result });
    } else
    if (row != title) {
        db.prepare('UPDATE pics SET name=@name WHERE hash=@hash').run({ hash: imgHash, name: title });
    }

    fs.unlinkSync(file);
}

var db_thumb;
async function generateRefMap(opts, onDone) {
    var dir = __dirname + '/dbs/';
    if (!files.isDir(dir)) files.mkdir(dir);
    var exists = fs.existsSync(dbFile);
    var dbFile = dir + opts.database + '.db';
    const db = require('better-sqlite3')(dbFile);
    if (!exists) {
        db.exec(`CREATE TABLE IF NOT EXISTS pics
         (
             id      INTEGER PRIMARY KEY AUTOINCREMENT,
             hash    CHAR(64)           NOT NULL,
             name    TEXT               NOT NULL
         );`);
    }
    var temp = __dirname + '/node_modules/webp-converter/temp/';
    if (!files.isDir(temp)) files.mkdir(temp);
    db_thumb = require('better-sqlite3')(dir + opts.database + '_thumbs.db');
    db_thumb.exec(`CREATE TABLE IF NOT EXISTS pics
     (
         hash    CHAR(64) PRIMARY KEY NOT NULL,
         pic     BLOB
     );`);
    var i_progress_old = 0;
    var done = 0;

    var videos = opts.videos ? opts.videos.split(',') : [];
    if (videos) {
        scanVideos(db, videos, onDone, (file) => {}, { pre: opts.pre });
        return;
    }

    const next = async function() {
        var list = [];
        files.searchDirFiles(__dirname + imgFolder, list, ['jpg', 'png'], 2);
        var i_progress_old = -1;
        if (Array.isArray(list) && list.length) {
            console.log(chalk.yellow(`导入${list.length}张图片中...`));
            for (let i = 0; i < list.length; i++) {
                await importImage(db, list[i]);
                var i_progress = parseInt(i / (list.length - 1) * 100);
                if (i_progress != i_progress_old) {
                    i_progress_old = i_progress;
                    // setShowing(i_progress + '%');
                    //console.log(i_progress+'%');
                    if (isNaN(i_progress) || i_progress >= 100) { // 0 / 0 = NaN
                        onDone();
                    }
                }
            }
        } else {
            onDone();
        }
    }

    var list = [];
    files.searchDirFiles(__dirname + videoFolder, list, ['mp4', 'ts', 'avi', 'mkv'], 2);
    scanVideos(db, list, next, (file) => {
        files.mkdir(__dirname + '/scaned/');
        files.move(file, __dirname + '/scaned/' + path.basename(file));;
    }, { pre: opts.pre });
}



function getTime(s) {
    var a = s.split(':');
    return (a[0] * 60 + a[1] * 1) * 60 + a[2] * 1;
}

async function initInMemoryHashMap(opts) {
    await generateRefMap(opts, () => {
        stopAllLog('succeed');
        if (opts.file) {
            getDuplicateImages(opts.database, opts.file);
        } else {
            console.log(chalk.green(`导入完成!`));
        }
    });
}

async function hash(imgFolder) {
    try {
        const data = await readFile(imgFolder);
        const hash = await blockhash.bmvbhash(getImageData(data), 8);
        return hexToBin(hash);
    } catch (error) {
        console.log(error);
    }
}


function hexToBin(hexString) {
    const hexBinLookup = {
        0: "0000",
        1: "0001",
        2: "0010",
        3: "0011",
        4: "0100",
        5: "0101",
        6: "0110",
        7: "0111",
        8: "1000",
        9: "1001",
        a: "1010",
        b: "1011",
        c: "1100",
        d: "1101",
        e: "1110",
        f: "1111",
        A: "1010",
        B: "1011",
        C: "1100",
        D: "1101",
        E: "1110",
        F: "1111",
    };
    let result = "";
    for (i = 0; i < hexString.length; i++) {
        result += hexBinLookup[hexString[i]];
    }
    return result;
}

function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) reject(err);
            resolve(imageFromBuffer(data));
        });
    });
}

function calculateSimilarity(hash1, hash2) {
    // Hamming Distance
    let similarity = 0;
    hash1Array = hash1.split("");
    hash1Array.forEach((bit, index) => {
        hash2[index] === bit ? similarity++ : null;
    });
    return parseInt((similarity / hash1.length) * 100);
}

async function compareImages(imgFolder1, imgFolder2) {
    const hash1 = await hash(imgFolder1);
    const hash2 = await hash(imgFolder2);
    return calculateSimilarity(hash1, hash2);
}


async function getSimilarity(database, hash1, showResult) {
    var dbFile = __dirname + '/dbs/' + database + '.db';
    if (!fs.existsSync(dbFile)) {
        console.log(chalk.red('没有找到数据库: ' + database));
        return;
    }

    const db = require('better-sqlite3')(dbFile);
    var max = 0;
    var match = [];
    for (var row of db.prepare('SELECT * FROM pics').all()) {
        row.similarity = calculateSimilarity(hash1, row.hash);
        if (match.length > 2) {
            for (var i = match.length; i > 0; i--) {
                if (match[i - 1].similarity < row.similarity) {
                    match[i - 1] = row;
                    break;
                }
            }
        } else {
            match.push(row);
            match.sort((a, b) => {
                return b.similarity - a.similarity;
            })
        }
    }
    if (match.length) {
        var dbThumb = __dirname + '/dbs/' + database + '_thumbs.db';
        var searchThumb = fs.existsSync(dbThumb);
        if (searchThumb) {
            var dbThumb = require('better-sqlite3')(dbThumb);
        }

        var h = '';
        match.forEach((item, index) => {
            if (searchThumb) {
                const row = dbThumb.prepare('SELECT pic FROM pics WHERE hash=?').get(item.hash);
                if (row) {
                    var img = 'data: image/jpeg;base64,' + Buffer.from(row.pic, 'binary').toString('base64');
                    match[index].preview = img;
                    h=`
                        <img src="${img}" alt="${item.name}">
                        <h4>[${item.similarity}%] ${item.name}</h4>
                        </br>

                    `+h;
                }

            }
            console.log(`[相似度: ${chalk.green(item.similarity+'%')}] -> ${chalk.yellow(item.name)}`);
        });
        if (showResult && h) {
            var temp = __dirname + '/result.html'
            fs.writeFileSync(temp, h);
            require("child_process").exec(temp);
        }
    } else {
        console.log(chalk.red('没有找到相似的图片!'));
    }
    return match;
}


async function getDuplicateImages(database, imgFolder) {
    var imgHash;
    var fromCmd = typeof(imgFolder) == 'string';
    if(fromCmd){
       console.log(`正在从数据库[ ${chalk.yellow(database)} ] 中搜索图片 [ ${chalk.yellow(imgFolder)} ] ...`);
         imgHash = await hash(imgFolder);
    }else{
        // buffer
        console.log(`正在从数据库[ ${chalk.yellow(database)} ] 中搜索图片 ...`);
        var image = await imageFromBuffer(imgFolder);
        const hash = await blockhash.bmvbhash(getImageData(image), 8);
        imgHash = hexToBin(hash);
    }
    return getSimilarity(database, imgHash, fromCmd);
}

module.exports = {
    compareImages,
    importImage,
    initInMemoryHashMap,
    getDuplicateImages,
};