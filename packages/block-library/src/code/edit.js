/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useTabIndentation } from './hook';

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
} ) {
	const blockProps = useBlockProps();
	const ref = useTabIndentation();

	return (
		<pre { ...blockProps }>
			<RichText
				ref={ ref }
				tagName="code"
				identifier="content"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onRemove={ onRemove }
				onMerge={ mergeBlocks }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
				__unstablePastePlainText
				__unstableOnSplitAtDoubleLineEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
			/>
		</pre>
	);
}
