const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const template = require('@babel/template').default;
const generate = require('@babel/generator').default;

// 在目标节点前插入代码

// 源代码
const sourceCode = `
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

// 生成AST
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

const targetCalleName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
traverse(ast, {
  CallExpression(path, state) {
    // 新节点不在遍历
    if(path.node.isNew) {
      return;
    };

    const calleeName = path.get('callee').toString();
    if (targetCalleName.includes(calleeName)) {
      const { line, column } = path.node.loc.start;
      const newNode = template.expression(`console.log("fileName: (${line}, ${column})")`)();
      newNode.isNew = true;

      if (path.findParent(path => path.isJSXElement())) {
        path.replaceWith(types.arrayExpression([newNode, path.node]));
        path.skip();
      } else {
        path.insertBefore(newNode);
      }
    }
  }
});

// AST => 目标代码
const { code } = generate(ast);
console.log(code);