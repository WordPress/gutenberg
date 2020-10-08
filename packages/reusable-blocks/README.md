# Reusable blocks

Building blocks for WordPress editors.

## Installation

Install the module

```bash
npm install @wordpress/reusable-blocks --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## How it works

This experimental module provides support for reusable blocks.

The most basic usage of this package would involve only telling the `<BlockEditorProvider` how to request reusable blocks from the API, and also pass it a list of the retrieved reusable blocks:

```js
const { __experimentalReusableBlocks } = useSelect(
    ( select ) => ( {
        __experimentalReusableBlocks: select(
            'core/reusable-blocks'
        ).__experimentalGetReusableBlocks(),
    } )
);

return (
    <BlockEditorProvider
        value={ blocks }
        onInput={ onInput }
        onChange={ onChange }
        settings={ {
            ...settings,
            __experimentalReusableBlocks,
        } }
        { ...props }
    />
);
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
