# Reusable blocks

Reusable blocks components and logic.

## Installation

Install the module

```bash
npm install @wordpress/reusable-blocks --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## How it works

This experimental module provides support for reusable blocks.

Reusable blocks are WordPress entities and the following is enough to ensure they are available in the inserter:

```js
const { __experimentalReusableBlocks } = useSelect( ( select ) =>
	select( 'core' ).getEntityRecords( 'postType', 'wp_block' )
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

const { __experimentalReusableBlocks } = useSelect( ( select ) =>
	select( 'core' ).getEntityRecords( 'postType', 'wp_block' )
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
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

function MyConvertToStaticButton( { clientId } ) {
	const { __experimentalConvertBlockToStatic } = useDispatch(
		reusableBlocksStore
	);
	return (
		<button
			onClick={ () => __experimentalConvertBlockToStatic( clientId ) }
		>
			Convert to static
		</button>
	);
}

function MyConvertToReusableButton( { clientId } ) {
	const { __experimentalConvertBlocksToReusable } = useDispatch(
		reusableBlocksStore
	);
	return (
		<button
			onClick={ () =>
				__experimentalConvertBlocksToReusable( [ clientId ] )
			}
		>
			Convert to reusable
		</button>
	);
}

function MyDeleteReusableBlockButton( { id } ) {
	const { __experimentalDeleteReusableBlock } = useDispatch(
		reusableBlocksStore
	);
	return (
		<button onClick={ () => __experimentalDeleteReusableBlock( id ) }>
			Delete reusable block
		</button>
	);
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
