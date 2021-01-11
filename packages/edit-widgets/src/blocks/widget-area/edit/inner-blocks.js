/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

export default function WidgetAreaInnerBlocks() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType'
	);
	return (
		<InnerBlocks
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			templateLock={ false }
			renderAppender={ InnerBlocks.DefaultBlockAppender }
			// HACK: The widget editor relies on a mapping of block client IDs
			// to widget IDs. We therefore instruct `useBlockSync` to not clone
			// the blocks it receives which would change the block client IDs`.
			// See https://github.com/WordPress/gutenberg/issues/27173.
			__unstableCloneValue={ false }
		/>
	);
}
