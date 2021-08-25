const targetCalleeNames = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

const parameterInsertPlugin = ({types, template}, options, dirname) => {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.isNew) {
          return;
        };

        const calleName = path.get('callee').toString();
        if (targetCalleeNames.includes(calleName)) {
          const { line, column } = path.node.loc.start;
          const newNode = template.expression(`console.log("${state.file.opts.filename || "unknow filename"}: (${line}, ${column})")`)();
          newNode.isNew = true;

          if (path.findParent(path => path.isJSXElement())) {
            path.replaceWith(types.arrayExpression([newNode, path.node]));
            path.skip(); // 跳出当前节点，不对其子节点遍历
          } else {
            path.insertBefore(newNode);
          }
        }
      },
    }
  }
};

module.exports = parameterInsertPlugin;