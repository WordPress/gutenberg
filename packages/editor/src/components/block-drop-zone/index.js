/**
 * External Dependencies
 */
import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { DropZone } from '@wordpress/components';
import {
	rawHandler,
	cloneBlock,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class BlockDropZone extends Component {
	constructor() {
		super( ...arguments );

		this.onFilesDrop = this.onFilesDrop.bind( this );
		this.onHTMLDrop = this.onHTMLDrop.bind( this );
		this.onDrop = this.onDrop.bind( this );
	}

	getInsertIndex( position ) {
		const { index } = this.props;
		if ( index !== undefined ) {
			return position.y === 'top' ? index : index + 1;
		}
	}

	onFilesDrop( files, position ) {
		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) => transform.type === 'files' && transform.isMatch( files )
		);

		if ( transformation ) {
			const insertIndex = this.getInsertIndex( position );
			const blocks = transformation.transform( files, this.props.updateBlockAttributes );
			this.props.insertBlocks( blocks, insertIndex );
		}
	}

	onHTMLDrop( HTML, position ) {
		const blocks = rawHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			this.props.insertBlocks( blocks, this.getInsertIndex( position ) );
		}
	}

	onDrop( event, position ) {
		if ( ! event.dataTransfer ) {
			return;
		}

		const { index: dstIndex, rootClientId: dstRootClientId } = this.props;

		let type, srcClientId, srcRootClientId, srcIndex;
		try {
			( { type, srcClientId, srcRootClientId, srcIndex } = JSON.parse( event.dataTransfer.getData( 'text' ) ) );
		} catch ( err ) {
			return;
		}

		if ( type !== 'block' ) {
			return;
		}

		const positionIndex = this.getInsertIndex( position );

		// If the block is kept at the same level and moved downwards,
		// subtract to account for blocks shifting upward to occupy its old position.
		// Note that rootClientId can be undefined or a void string if the block is at the top-level.
		const isSameLevel = ( ) => ( srcRootClientId === dstRootClientId ) || ( ! srcRootClientId === true && ! dstRootClientId === true );
		const insertIndex = dstIndex && srcIndex < dstIndex && isSameLevel() ? positionIndex - 1 : positionIndex;
		this.props.moveBlockToPosition( srcClientId, srcRootClientId, insertIndex );
	}

	render() {
		const { isLocked, index } = this.props;
		if ( isLocked ) {
			return null;
		}
		const isAppender = index === undefined;

		return (
			<DropZone
				className={ classnames( 'editor-block-drop-zone', {
					'is-appender': isAppender,
				} ) }
				onFilesDrop={ this.onFilesDrop }
				onHTMLDrop={ this.onHTMLDrop }
				onDrop={ this.onDrop }
			/>
		);
	}
}

export default compose(
	withDispatch( ( dispatch, ownProps ) => {
		const {
			insertBlocks,
			updateBlockAttributes,
			moveBlockToPosition,
		} = dispatch( 'core/editor' );

		return {
			insertBlocks( blocks, index ) {
				const { rootClientId, layout } = ownProps;

				if ( layout ) {
					// A block's transform function may return a single
					// transformed block or an array of blocks, so ensure
					// to first coerce to an array before mapping to inject
					// the layout attribute.
					blocks = castArray( blocks ).map( ( block ) => (
						cloneBlock( block, { layout } )
					) );
				}

				insertBlocks( blocks, index, rootClientId );
			},
			updateBlockAttributes( ...args ) {
				updateBlockAttributes( ...args );
			},
			moveBlockToPosition( srcClientId, srcRootClientId, dstIndex ) {
				const { rootClientId: dstRootClientId, layout } = ownProps;
				moveBlockToPosition( srcClientId, srcRootClientId, dstRootClientId, layout, dstIndex );
			},
		};
	} ),
	withSelect( ( select, { rootClientId } ) => {
		const { getTemplateLock } = select( 'core/editor' );
		return {
			isLocked: !! getTemplateLock( rootClientId ),
		};
	} )
)( BlockDropZone );
