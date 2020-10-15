# Reusable blocks

Reusable blocks components and logic.  

## Installation

Install the module

```bash
npm install @wordpress/reusable-blocks --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## How it works

This experimental module provides support for reusable blocks.

Reusable blocks are WordPress entities and the following is enough to ensure they are available in the inserter:

```js
const { __experimentalReusableBlocks } = useSelect(
    ( select ) => select( 'core' ).getEntityRecords(
        'postType',
        'wp_block',
    )
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

With the above configuration management features (such as creating new reusable blocks) are still missing from the editor. Enter `@wordpress/reusable-blocks`:

```js
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

const { __experimentalReusableBlocks } = useSelect(
    ( select ) => select( 'core' ).getEntityRecords(
        'postType',
        'wp_block',
    )
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
    >
        <ReusableBlocksMenuItems />
        { children }
    </BlockEditorProvider>
);
```

This package also provides convenient utilities for managing reusable blocks through redux actions:

```js
function MyConvertToStaticButton( { clientId } ) {
    const { __experimentalConvertBlockToStatic } = useDispatch( 'core/reusable-blocks' );
    return (
        <button onClick={() => __experimentalConvertBlockToStatic( clientId )} >
            Convert to static
        </button>
    );
}

function MyConvertToReusableButton( { clientId } ) {
    const { __experimentalConvertBlocksToReusable } = useDispatch( 'core/reusable-blocks' );
    return (
        <button onClick={() => __experimentalConvertBlocksToReusable( [ clientId ] )} >
            Convert to reusable
        </button>
    );
}

function MyDeleteReusableBlockButton( { id } ) {
    const { __experimentalDeleteReusableBlock } = useDispatch( 'core/reusable-blocks' );
    return (
        <button onClick={() => __experimentalDeleteReusableBlock( id )} >
            Delete reusable block
        </button>
    );
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
