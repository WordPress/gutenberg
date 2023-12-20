/**
 * External dependencies
 */
import classnames from 'classnames';
// diff doesn't tree-shake correctly, so we import from the individual
// module here, to avoid including too much of the library
import { diffChars } from 'diff/lib/diff/character';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getSaveContent } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockView from './block-view';

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
			const classes = classnames( {
				'block-editor-block-compare__added': item.added,
				'block-editor-block-compare__removed': item.removed,
			} );

			return (
				<span key={ pos } className={ classes }>
					{ item.value }
				</span>
			);
		} );
	}

	function getConvertedContent( convertedBlock ) {
		// The convertor may return an array of items or a single item.
		const newBlocks = Array.isArray( convertedBlock )
			? convertedBlock
			: [ convertedBlock ];

		// Get converted block details.
		const newContent = newBlocks.map( ( item ) =>
			getSaveContent( item.name, item.attributes, item.innerBlocks )
		);

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
