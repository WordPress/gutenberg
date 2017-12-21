/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { reduce, get, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone, withContext } from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { insertBlocks } from '../../actions';

function BlockDropZone( { index, isLocked, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const dropFiles = ( files, position ) => {
		const transformation = reduce( getBlockTypes(), ( ret, blockType ) => {
			if ( ret ) {
				return ret;
			}

			return find( get( blockType, 'transforms.from', [] ), ( transform ) => (
				transform.type === 'files' && transform.isMatch( files )
			) );
		}, false );

		if ( transformation ) {
			let insertPosition;
			if ( index !== undefined ) {
				insertPosition = position.y === 'top' ? index : index + 1;
			}
			transformation.transform( files ).then( ( blocks ) => {
				props.insertBlocks( blocks, insertPosition );
			} );
		}
	};

	const onDrop = ( event, position ) => {
		if ( props.dropEffect === 'reorder' && index !== undefined ) {
			const { uid, fromIndex } = JSON.parse( event.dataTransfer.getData( 'json/text' ) );

			if ( position.y === 'top' && index > fromIndex ) {
				props.onDrop( uid, index - 1 );
				return;
			} else if ( position.y === 'bottom' && index < fromIndex ) {
				props.onDrop( uid, index + 1 );
				return;
			}

			props.onDrop( uid, index );
			return;
		}

		props.onDrop( event, position );
	};

	return (
		<DropZone
			onFilesDrop={ dropFiles }
			onDrop={ onDrop }
		/>
	);
}

export default compose(
	connect(
		undefined,
		{ insertBlocks }
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} )
)( BlockDropZone );
