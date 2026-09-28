import clsx from 'clsx';
import { diffChars } from 'diff';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlockContent } from '@wordpress/blocks';
import BlockView from './block-view';

/**
 * Renders the text of an added or removed diff part, marking each of its
 * newlines with a visible symbol. The highlight of a changed part has no width
 * at a bare line break, so without the symbol a difference made of blank lines
 * cannot be seen.
 *
 * @param {string} value Text of the diff part.
 * @return {Array} Text pieces, with a marker before each newline.
 */
function getChangedValue( value ) {
	return value.split( /(\n)/ ).map( ( piece, index ) =>
		piece === '\n' ? (
			<Fragment key={ index }>
				<span
					className="block-editor-block-compare__newline"
					aria-hidden="true"
				>
					↵
				</span>
				{ piece }
			</Fragment>
		) : (
			piece
		)
	);
}

function BlockCompare( {
	block,
	onKeep,
	onConvert,
	convertor,
	convertButtonText,
} ) {
	function getDifference( originalContent, newContent ) {
		const difference = diffChars( originalContent, newContent );

		return difference.map( ( item, pos ) => {
			const isChanged = item.added || item.removed;
			const classes = clsx( {
				'block-editor-block-compare__added': item.added,
				'block-editor-block-compare__removed': item.removed,
			} );

			return (
				<span key={ pos } className={ classes }>
					{ isChanged ? getChangedValue( item.value ) : item.value }
				</span>
			);
		} );
	}

	function getConvertedContent( convertedBlock ) {
		// The convertor may return an array of items or a single item.
		const newBlocks = Array.isArray( convertedBlock )
			? convertedBlock
			: [ convertedBlock ];

		// Get converted block details. `getBlockContent` also covers the
		// Custom HTML block, which keeps its markup in `innerContent` rather
		// than producing it from `save`.
		const newContent = newBlocks.map( ( item ) => getBlockContent( item ) );

		return newContent.join( '' );
	}

	const converted = getConvertedContent( convertor( block ) );
	const difference = getDifference( block.originalContent, converted );

	return (
		<div className="block-editor-block-compare__wrapper">
			<BlockView
				title={ __( 'Current' ) }
				className="block-editor-block-compare__current"
				action={ onKeep }
				actionText={ __( 'Convert to HTML' ) }
				rawContent={ block.originalContent }
				renderedContent={ block.originalContent }
			/>

			<BlockView
				title={ __( 'After Conversion' ) }
				className="block-editor-block-compare__converted"
				action={ onConvert }
				actionText={ convertButtonText }
				rawContent={ difference }
				renderedContent={ converted }
			/>
		</div>
	);
}

export default BlockCompare;
