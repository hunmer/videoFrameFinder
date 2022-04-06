module.exports = {
    getParams: (k) => {
    return k == undefined ? cliOptions : cliOptions[k];
  }
};
const yargs = require("yargs");
const chalk = require("chalk");
const cliOptions = yargs.usage("Usage: -t [dbPath] -p [imgPath]")
.option("t", {
  alias: "database",
  describe: chalk.yellow("指定数据库文件"),
  type: "string",
  demandOption: true,
})
.option("i", {
  alias: "file",
  describe: chalk.yellow("指定搜素的图片"),
  type: "string",
  demandOption: false,
})
.option("v", {
  alias: "videos",
  describe: chalk.yellow("指定解析的视频文件列表(,隔开)"),
  type: "string",
  demandOption: false,
})
.option("d", {
  alias: "pre",
  describe: chalk.yellow("指定分割的长度(描述)"),
  type: "number",
  demandOption: false,
})
.option("s", {
  alias: "skip",
  describe: chalk.yellow("跳过已存在的图片"),
  demandOption: false,
})
.argv;
const { initInMemoryHashMap, getDuplicateImages } = require("./main");


(async function () {
  console.log(cliOptions);
  await initInMemoryHashMap(cliOptions);
})();

