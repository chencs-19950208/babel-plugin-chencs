import _intl from 'intl';

/**
 * App 示例代码
 */
function App() {
  const title = _intl.t('intl1');

  const desc = _intl.t('intl2');

  const desc2 = `desc`;

  const desc3 = _intl.t('intl3', title + desc, desc2);

  return <div className={_intl.t('intl4')} title={_intl.t('intl5')}>
        <img src={Logo} />
        <h1>${title}</h1>
        <p>${desc}</p>  
        <div>
        {_intl.t('intl6')}
        </div>
      </div>;
}