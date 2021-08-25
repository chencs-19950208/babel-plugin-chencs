const { transformFromAstSync, parseSync } = require('@babel/core');
const parser = require('@babel/parser');
const insertParameterPlugin = require('./plugin/babel-log');
const fs = require('fs');
const path = require('path');

// 插件
// 读取文件中的源码
const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8',
});

// 转化AST
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

// AST 转 目标代码
const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [insertParameterPlugin],
  filename: 'sourceCode',
});

console.log(code);