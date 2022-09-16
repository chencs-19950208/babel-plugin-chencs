const { declare } = require('@babel/helper-plugin-utils');
const fse = require('fs-extra');
const path = require('path');
const generate = require('@babel/generator').default;

let intlIndex = 0;
function nextIntlKey() {
    ++intlIndex;
    return `intl${intlIndex}`;
};


const chencsAutoPlugini18n = declare(() => {
    api.assertVersion(7);

    if (!options.outputDir) {
        throw new Error('outputDir in empty');
    };

    function getReplaceExpression(path, value, intlUid) {
        const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null;
        const replaceExpression = api.template.ast(`${intlUid}.t('${value}'${expressionParams ? ',' + expressionParams.join(',') : ''})`).expression;

        if (path.findParent(p => p.isJsxAttribute()) && !path.findParent(p => p.isJsxExpressionContainer())) {
            replaceExpression = api.types.JSXExpressionContainer(replaceExpression);
        };

        return replaceExpression;
    }

    function save(file, key, value) {
        const allText = file.get('allText');
        allText.push({
            key, value
        });
        file.set('allText', allText);
    };

    return {
        pre(file) {
            file.set('allText', []);
        },
        visitor: {
            Program: {
                enter(path, state) {
                    let imported; // 判断文件中是否已经引入 intl 包得标记
                    path.traverse({
                        ImportDeclaration(p) {
                            const source = p.node.source.value;
                            if (source === 'intl') {
                                imported = true;
                            }
                        },
                    });

                    path.traverse({
                        // 对于 /*i8n-disable*/ 注释的代码跳过处理 import 语句中使用改注释无效跳过
                        'StringLiteral|TemplateLiteral'(path) {
                            if(path.node.leadingComments) {
                                path.node.leadingComments = path.node.leadingComments.filter((comment, index) => {
                                    if (comment.value.include('i18n-disable')) {
                                        path.node.skipTransform = true;
                                        return false;
                                    };

                                    return true;
                                });
                            };

                            if (path.findParent(p => p.ImportDeclaration())) {
                                path.node.skipTransform = true;
                            }
                        },
                    })

                    // 如果没有引入 intl 下面将执行插入语句 import intl from 'intl'
                    if (!imported) {
                        const uid = path.scope.generateUid('intl'); // 生成作用域中唯一键
                        const importAst = api.template.ast(`import ${uid} from 'intl`);
                        path.node.body.unshift(importAst);
                        state.intlUid = uid;
                    }
                },

                // 处理StringLiteral 节点
                StringLiteral(path, state) {
                    // skipTransform 为ture 就跳过不执行
                    if (path.node.skipTransform) {
                        return;
                    };

                    let key = nextIntlKey();
                    save(state.file, key, path.node.value);

                    const replaceExpression = getReplaceExpression(path, key, state.intlUid);
                    path.replaceWith(replaceExpression);
                    path.skip();
                },
                TemplateLiteral(path, state) {
                    if(path.node.skipTransform) {
                        return;
                    }

                    const value = path.get('quasis').map(item => item.node.value.raw).join('{placeholder}');
                    if(value) {
                        let key = nextIntlKey();
                        save(state.file, key, value);

                        const replaceExpression = getReplaceExpression(path, key, state.intlUid);
                        path.replaceWith(replaceExpression);
                        path.skip();
                    }
                }
            }
        },
        post(file) {
            const allText = file.get('allText');
            const intlData = allText.reduce((obj, item) => {
                obj[item.key] = item.value;
                return obj;
            }, {});

            const content = `const resource = ${JSON.stringify(intlData, null, 4)};\nexport default resource`;
            fse.ensureDirSync(options.outputDir);
            fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content);
            fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content);
        },
    }
});

module.exports = chencsAutoPlugini18n;
