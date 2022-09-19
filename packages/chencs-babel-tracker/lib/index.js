const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const chencsBabelTracker = require('./chencs-babel-tracker');
const fs = require('fs');
const path = require('path');

const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8'
});

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[chencsBabelTracker, {
    trackerPath: 'tracker'
  }]]
});

if (code) {
  console.log(code);
  fs.writeFileSync('./newCode.js', code);
}