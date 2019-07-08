/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	DropZone,
	withFilters,
} from '@wordpress/components';
import {
	pasteHandler,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MediaUploadCheck from '../media-upload/check';

const parseDropEvent = ( event ) => {
	let result = {
		srcRootClientId: null,
		srcClientId: null,
		srcIndex: null,
		type: null,
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign( result, JSON.parse( event.dataTransfer.getData( 'text' ) ) );
	} catch ( err ) {
		return result;
	}

	return result;
};

class BlockDropZone extends Component {
	constructor() {
		super( ...arguments );

		this.onFilesDrop = this.onFilesDrop.bind( this );
		this.onHTMLDrop = this.onHTMLDrop.bind( this );
		this.onDrop = this.onDrop.bind( this );
		this.onDragOver = this.onDragOver.bind( this );
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
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			this.props.insertBlocks( blocks, this.getInsertIndex( position ) );
		}
	}

	onDrop( event ) {
		this.moveBlock( parseDropEvent( event ) );
	}

	onDragOver( event ) {
		if ( event.type !== 'default' ) {
			return;
		}
		this.moveBlock( event.data );
	}

	moveBlock( data ) {
		const {
			rootClientId: dstRootClientId,
			clientId: dstClientId,
			getClientIdsOfDescendants,
			getBlockIndex,
			getBlockRootClientId,
		} = this.props;

		const { clientId, type } = data;

		const isBlockDropType = ( dropType ) => dropType === 'block';
		const isSameBlock = ( src, dst ) => src === dst;
		const isSrcBlockAnAncestorOfDstBlock = ( src, dst ) => getClientIdsOfDescendants( [ src ] ).some( ( id ) => id === dst );

		if ( ! isBlockDropType( type ) ||
				isSameBlock( clientId, dstClientId ) ||
				isSrcBlockAnAncestorOfDstBlock( clientId, dstClientId || dstRootClientId ) ) {
			return;
		}

		const dstIndex = getBlockIndex( dstClientId, dstRootClientId );
		const srcRootClientId = getBlockRootClientId( clientId );
		this.props.moveBlockToPosition( clientId, srcRootClientId, dstIndex );
	}

	render() {
		const { isLockedAll, index } = this.props;
		if ( isLockedAll ) {
			return null;
		}
		const isAppender = index === undefined;

		return (
			<MediaUploadCheck>
				<DropZone
					className={ classnames( 'editor-block-drop-zone block-editor-block-drop-zone', {
						'is-appender': isAppender,
					} ) }
					onFilesDrop={ this.onFilesDrop }
					onHTMLDrop={ this.onHTMLDrop }
					onDrop={ this.onDrop }
					onDragOver={ this.onDragOver }
				/>
			</MediaUploadCheck>
		);
	}
}

export default compose(
	withDispatch( ( dispatch, ownProps ) => {
		const {
			insertBlocks,
			updateBlockAttributes,
			moveBlockToPosition,
		} = dispatch( 'core/block-editor' );

		return {
			insertBlocks( blocks, index ) {
				const { rootClientId } = ownProps;

				insertBlocks( blocks, index, rootClientId );
			},
			updateBlockAttributes( ...args ) {
				updateBlockAttributes( ...args );
			},
			moveBlockToPosition( srcClientId, srcRootClientId, dstIndex ) {
				const { rootClientId: dstRootClientId } = ownProps;
				moveBlockToPosition( srcClientId, srcRootClientId, dstRootClientId, dstIndex );
			},
		};
	} ),
	withSelect( ( select, { rootClientId } ) => {
		const {
			getClientIdsOfDescendants,
			getTemplateLock,
			getBlockIndex,
			getBlockRootClientId,
		} = select( 'core/block-editor' );
		return {
			isLockedAll: getTemplateLock( rootClientId ) === 'all',
			getClientIdsOfDescendants,
			getBlockIndex,
			getBlockRootClientId,
		};
	} ),
	withFilters( 'editor.BlockDropZone' )
)( BlockDropZone );
