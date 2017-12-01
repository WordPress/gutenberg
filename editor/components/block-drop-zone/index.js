/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { reduce, get, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone } from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { insertBlocks } from '../../actions';

function BlockDropZone( { index, ...props } ) {
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

	const drop = ( event, position ) => {
		const numFiles = event.dataTransfer ? event.dataTransfer.files.length : 0;

		if ( numFiles === 0 ) {
			const html = event.dataTransfer.getData( 'text/html' );
			const transformation = reduce( getBlockTypes(), ( ret, blockType ) => {
				if ( ret ) {
					return ret;
				}

				return find( get( blockType, 'transforms.from', [] ), ( transform ) => {
					return transform.type === 'html' && transform.isMatch( html );
				} );
			}, false );

			if ( transformation ) {
				let insertPosition;
				if ( index !== undefined ) {
					insertPosition = position.y === 'top' ? index : index + 1;
				}

				transformation.transform( html ).then( ( blocks ) => {
					props.insertBlocks( blocks, insertPosition );
				} );
			}
		}
	}

	return (
		<DropZone
			onFilesDrop={ dropFiles }
			onDrop={ drop }
		/>
	);
}

export default connect(
	undefined,
	{ insertBlocks }
)( BlockDropZone );
