/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Renders the content of the current post in a controlled inner block area.
 *
 * @param {Object} Props Component props.
 * @param {string} Props.postType The postType to use for the entity blocks.
 * @return {Function} Controlled InnerBlocks of the current post.
 */
export default function PostContentInnerBlocks( { postType } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{
			initialEdits: { status: 'publish' },
		}
	);
	return (
		<InnerBlocks
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
		/>
	);
}
