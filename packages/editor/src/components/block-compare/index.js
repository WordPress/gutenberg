/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { getBlockType, getSaveContent, getSaveElement } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockView from './block-view';
import Diff from './diff';

class BlockCompare extends Component {
	getDifference( originalContent, newContent ) {
		const differ = new Diff();
		const difference = differ.diff( originalContent, newContent );

		return difference.map( ( item, pos ) => {
			if ( item.added ) {
				return <span key={ pos } className="editor-block-compare__added">{ item.value }</span>;
			} else if ( item.removed ) {
				return <span key={ pos } className="editor-block-compare__removed">{ item.value }</span>;
			}

			return <span key={ pos }>{ item.value }</span>;
		} );
	}

	getOriginalContent( block ) {
		// Get current block details
		const blockType = getBlockType( block.name );

		return {
			content: block.originalContent,
			render: getSaveElement( blockType, block.attributes ),
		};
	}

	getConvertedContent( block ) {
		// The convertor may return an array of items or a single item
		const newBlocks = Array.isArray( block ) ? block : [ block ];

		// Get converted block details
		const newContent = newBlocks.map( ( item ) => getSaveContent( getBlockType( item.name ), item.attributes, item.innerBlocks ) );
		const render = newBlocks.map( ( item ) => getSaveElement( getBlockType( item.name ), item.attributes, item.innerBlocks ) );

		return {
			content: newContent.join( '' ),
			render,
		};
	}

	render() {
		const { block, onKeep, onConvert, convertor, convertButtonText } = this.props;
		const original = this.getOriginalContent( block );
		const converted = this.getConvertedContent( convertor( block ), original );
		const difference = this.getDifference( original.content, converted.content );

		return (
			<div className="editor-block-compare__wrapper">
				<BlockView
					title={ __( 'Current' ) }
					className="editor-block-compare__current"
					action={ onKeep }
					actionText={ __( 'Keep as HTML' ) }
					rawContent={ original.content }
					renderedContent={ original.render }
				/>

				<BlockView
					title={ __( 'After Conversion' ) }
					className="editor-block-compare__converted"
					action={ onConvert }
					actionText={ convertButtonText }
					rawContent={ difference }
					renderedContent={ converted.render }
				/>
			</div>
		);
	}
}

export default BlockCompare;
