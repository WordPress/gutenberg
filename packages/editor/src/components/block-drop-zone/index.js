/**
 * External Dependencies
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
	}

	getInsertIndex( position ) {
		const { clientId, rootClientId, getBlockIndex } = this.props;
		if ( clientId !== undefined ) {
			const index = getBlockIndex( clientId, rootClientId );
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
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			this.props.insertBlocks( blocks, this.getInsertIndex( position ) );
		}
	}

	onDrop( event, position ) {
		const { rootClientId: dstRootClientId, clientId: dstClientId, getClientIdsOfDescendants, getBlockIndex } = this.props;
		const { srcRootClientId, srcClientId, srcIndex, type } = parseDropEvent( event );

		const isBlockDropType = ( dropType ) => dropType === 'block';
		const isSameLevel = ( srcRoot, dstRoot ) => {
			// Note that rootClientId of top-level blocks will be undefined OR a void string,
			// so we also need to account for that case separately.
			return ( srcRoot === dstRoot ) || ( ! srcRoot === true && ! dstRoot === true );
		};
		const isSameBlock = ( src, dst ) => src === dst;
		const isSrcBlockAnAncestorOfDstBlock = ( src, dst ) => getClientIdsOfDescendants( [ src ] ).some( ( id ) => id === dst );

		if ( ! isBlockDropType( type ) ||
			isSameBlock( srcClientId, dstClientId ) ||
			isSrcBlockAnAncestorOfDstBlock( srcClientId, dstClientId ) ) {
			return;
		}

		const dstIndex = dstClientId ? getBlockIndex( dstClientId, dstRootClientId ) : undefined;
		const positionIndex = this.getInsertIndex( position );
		// If the block is kept at the same level and moved downwards,
		// subtract to account for blocks shifting upward to occupy its old position.
		const insertIndex = dstIndex && srcIndex < dstIndex && isSameLevel( srcRootClientId, dstRootClientId ) ? positionIndex - 1 : positionIndex;
		this.props.moveBlockToPosition( srcClientId, srcRootClientId, insertIndex );
	}

	render() {
		const { isLocked, index } = this.props;
		if ( isLocked ) {
			return null;
		}
		const isAppender = index === undefined;

		return (
			<MediaUploadCheck>
				<DropZone
					className={ classnames( 'editor-block-drop-zone', {
						'is-appender': isAppender,
					} ) }
					onFilesDrop={ this.onFilesDrop }
					onHTMLDrop={ this.onHTMLDrop }
					onDrop={ this.onDrop }
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
		} = dispatch( 'core/editor' );

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
		const { getClientIdsOfDescendants, getTemplateLock, getBlockIndex } = select( 'core/editor' );
		return {
			isLocked: !! getTemplateLock( rootClientId ),
			getClientIdsOfDescendants,
			getBlockIndex,
		};
	} ),
	withFilters( 'editor.BlockDropZone' )
)( BlockDropZone );
