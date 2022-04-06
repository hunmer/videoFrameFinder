const fs = require("fs");
const path = require("path");
const files = {
    exists: (path) => fs.existsSync(path),
    isFile: (path) => fs.existsSync(path) && fs.statSync(path).isFile(),
    isDir: (path) => fs.existsSync(path) && fs.statSync(path).isDirectory(),
    mkdir: (dir) => mkdirsSync(dir),
    write: (file, content) => fs.writeFileSync(file, content),
     searchDirFiles: (dir, list, fileExts, C)=> {
    fs.readdirSync(dir).forEach(fileName => {
        var path = files.join(dir, fileName);
        if (files.isDir(path) && ((!C && C != 0) || C > 0)) {
            if (files.isEmptyDir(path)) return files.removeDir(path);
            searchDirFiles(path, list, fileExts, C - 1);
            return;
        }
        for (var i = 0; i < fileExts.length; i++) {
            if (fileName.endsWith(fileExts[i])) {
                list.push(path);
                return;
            }
        }
    });
},
    getExtension: (file) => path.extname(file).replace('.', ''),
    remove: (file) => {fs.rmSync(file)},
    copy: (oldFile, newFile) => {
        fs.copyFileSync(oldFile, newFile);
        return fs.existsSync(newFile);
    },
    copyMove: (oldFile, newFile) => {
        fs.copyFileSync(oldFile, newFile);
        fs.unlinkSync(oldFile);
        // fs.renameSync(oldFile, newFile);
        return fs.existsSync(newFile);
    },
    move: (oldFile, newFile) => {
        fs.renameSync(oldFile, newFile);
    },
    join: (dir, file) => path.join(dir, file),
    listDir: (dir) => {
        var res = [];
        fs.readdirSync(dir).forEach(function(name) {
            var filePath = path.join(dir, name);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                res.push(filePath);
            }
        });
        return res;
    },
    isEmptyDir: (dir) => fs.readdirSync(dir).length == 0,
    removeDir: (dir) => fs.rmSync(dir, { recursive: true, force: true }),
    stat: (file) => fs.statSync(file),
}

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
    }
}

module.exports = files;
