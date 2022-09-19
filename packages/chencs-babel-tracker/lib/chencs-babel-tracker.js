const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');

const chencsBabelTracker = declare((api, options, dirname) => {
    // 表明是babel7
    api.assertVersion(7);

    return {
        visitor: {
            Program: {
                enter(path, state) {
                    path.traverse({
                        // 遍历 import 节点，这里需要检索是否引入 tracker 插件，没有则插入，有则略过
                        ImportDeclaration(curPath) {
                            // import 的资源值
                            const requirePath = curPath.get('source').node.value;
                            if(requirePath === options.trackerPath) {
                                const specifierPath = curPath.get('specifiers.0');

                                if (specifierPath.isImportSpecifier()) {
                                    state.trackerImportId = specifierPath.toString();
                                } else if (specifierPath.isImportNamespaceSpecifier()) {
                                    state.trackerImportId = specifierPath.get('local').toString();
                                };

                                path.stop();
                            };
                        }
                    });

                    // 如果不存在，就需要引入插件
                    if (!state.trackerImportId) {
                        state.trackerImportId = importModule.addDefault(path, 'tracker', {
                            nameHint: path.scope.generateUid('tracker')
                        }).name;

                        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
                    }
                }
            },

            // 处理函数插桩
            'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
                const bodyPath = path.get('body');

                if(bodyPath.isBlockStatement()) {
                    bodyPath.node.body.unshift(state.trackerAST);
                } else {
                    const ast = api.template.statement(`{${state.trackerImportId}(); return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
                    bodyPath.replaceWith(ast);
                }
            }
        }
    }
})

module.exports = chencsBabelTracker;
