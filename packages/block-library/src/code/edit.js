/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

const SUPPORTS_BREAK_SPACES =
	typeof CSS !== 'undefined' &&
	// eslint-disable-next-line no-undef
	CSS.supports &&
	// eslint-disable-next-line no-undef
	CSS.supports( 'white-space', 'break-spaces' );

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
} ) {
	const blockProps = useBlockProps();
	const whiteSpaceStyle = SUPPORTS_BREAK_SPACES ? 'break-spaces' : 'pre-wrap';

	return (
		<pre { ...blockProps }>
			<RichText
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
				style={ { whiteSpace: whiteSpaceStyle } }
			/>
		</pre>
	);
}