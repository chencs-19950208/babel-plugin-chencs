const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const chencsAutoPlugini18n = require('./chencs-i18n');
const fs = require('fs');
const path = require('path');

// 读到源码字符串
const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8',
});

// 源代码转AST
const AST_CODE = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

// 新的源码
const { code } = transformFromAstSync(AST_CODE, {
  plugins: [[chencsAutoPlugini18n, {
    outputDir: path.resolve(__dirname, './output')
  }]]
});

// 写入到新的文件中
if (code) {
  console.log(code);
  fs.writeFileSync('./newCode.js', code);
}

