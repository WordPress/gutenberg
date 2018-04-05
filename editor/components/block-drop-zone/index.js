/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone, withContext } from '@wordpress/components';
import {
	rawHandler,
	cloneBlock,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { compose, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { insertBlocks, updateBlockAttributes, moveBlockToPosition } from '../../store/actions';

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

		let uid, type, rootUID, fromIndex, blocks;

		try {
			( { uid, type, rootUID, fromIndex, blocks } = JSON.parse( event.dataTransfer.getData( 'text' ) ) );
		} catch ( err ) {
			return;
		}

		if ( type !== 'block' ) {
			return;
		}
		const { index } = this.props;
		const positionIndex = this.getInsertIndex( position );

		// If the block is kept at the same level and moved downwards, subtract
		// to account for blocks shifting upward to occupy its old position.
		const insertIndex = index && fromIndex < index && rootUID === this.props.rootUID ? positionIndex - 1 : positionIndex;

		if ( blocks ) {
			// TODO: Replace !
			this.props.insertBlocks( blocks, insertIndex );
		} else {
			this.props.moveBlockToPosition( uid, rootUID, insertIndex );
		}
	}

	render() {
		const { isLocked } = this.props;
		if ( isLocked ) {
			return null;
		}

		return (
			<DropZone
				onFilesDrop={ this.onFilesDrop }
				onHTMLDrop={ this.onHTMLDrop }
				onDrop={ this.onDrop }
			/>
		);
	}
}

export default compose(
	connect(
		undefined,
		( dispatch, ownProps ) => {
			return {
				insertBlocks( blocks, insertIndex ) {
					const { rootUID, layout } = ownProps;

					if ( layout ) {
						// A block's transform function may return a single
						// transformed block or an array of blocks, so ensure
						// to first coerce to an array before mapping to inject
						// the layout attribute.
						blocks = castArray( blocks ).map( ( block ) => (
							cloneBlock( block, { layout } )
						) );
					}

					dispatch( insertBlocks( blocks, insertIndex, rootUID ) );
				},
				updateBlockAttributes( ...args ) {
					dispatch( updateBlockAttributes( ...args ) );
				},
				moveBlockToPosition( uid, fromRootUID, index ) {
					const { rootUID, layout } = ownProps;
					dispatch( moveBlockToPosition( uid, fromRootUID, rootUID, layout, index ) );
				},
			};
		},
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} )
)( BlockDropZone );
