const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');

const sourceCode =
  `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
  `;

// 转成AST
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

// 处理AST
const targetCalleeName = ['log', 'error', 'debug', 'info'].map(item => `console.${item}`);
traverse(ast, {
  CallExpression(path, state) {
    const calleeName = generate(path.node.callee).code;

    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start;

      path.node.arguments.unshift(types.stringLiteral(`filename ${line}, ${column}`))
    }
  }
})

// 打印目标代码
const { code, map } = generate(ast);

console.log(code);
console.log(map);

