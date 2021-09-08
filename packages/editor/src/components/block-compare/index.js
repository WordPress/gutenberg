/**
 * External dependencies
 */
import classnames from 'classnames';
import { castArray } from 'lodash';
import { diffChars } from 'diff';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { getSaveContent } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockView from './block-view';

class BlockCompare extends Component {
	getDifference( originalContent, newContent ) {
		const difference = diffChars( originalContent, newContent );

		return difference.map( ( item, pos ) => {
			const classes = classnames( {
				'editor-block-compare__added': item.added,
				'editor-block-compare__removed': item.removed,
			} );

			return <span key={ pos } className={ classes }>{ item.value }</span>;
		} );
	}

	getConvertedContent( block ) {
		// The convertor may return an array of items or a single item
		const newBlocks = castArray( block );

		// Get converted block details
		const newContent = newBlocks.map( ( item ) => getSaveContent( item.name, item.attributes, item.innerBlocks ) );

		return newContent.join( '' );
	}

	render() {
		const { block, onKeep, onConvert, convertor, convertButtonText } = this.props;
		const converted = this.getConvertedContent( convertor( block ) );
		const difference = this.getDifference( block.originalContent, converted );

		return (
			<div className="editor-block-compare__wrapper">
				<BlockView
					title={ __( 'Current' ) }
					className="editor-block-compare__current"
					action={ onKeep }
					actionText={ __( 'Convert to HTML' ) }
					rawContent={ block.originalContent }
					renderedContent={ block.originalContent }
				/>

				<BlockView
					title={ __( 'After Conversion' ) }
					className="editor-block-compare__converted"
					action={ onConvert }
					actionText={ convertButtonText }
					rawContent={ difference }
					renderedContent={ converted }
				/>
			</div>
		);
	}
}

export default BlockCompare;
