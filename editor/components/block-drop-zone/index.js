/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { reduce, get, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone, withContext } from '@wordpress/components';
import { getBlockTypes, rawHandler } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { insertBlocks, updateBlockAttributes } from '../../store/actions';

function BlockDropZone( { index, isLocked, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const getInsertPosition = ( position ) => {
		if ( index !== undefined ) {
			return position.y === 'top' ? index : index + 1;
		}
	};

	const onDropFiles = ( files, position ) => {
		const transformation = reduce( getBlockTypes(), ( ret, blockType ) => {
			if ( ret ) {
				return ret;
			}

			return find( get( blockType, 'transforms.from', [] ), ( transform ) => (
				transform.type === 'files' && transform.isMatch( files )
			) );
		}, false );

		if ( transformation ) {
			const insertPosition = getInsertPosition( position );
			const blocks = transformation.transform( files, props.updateBlockAttributes );
			props.insertBlocks( blocks, insertPosition );
		}
	};

	const onHTMLDrop = ( HTML, position ) => {
		const blocks = rawHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			props.insertBlocks( blocks, getInsertPosition( position ) );
		}
	};

	return (
		<DropZone
			onFilesDrop={ onDropFiles }
			onHTMLDrop={ onHTMLDrop }
		/>
	);
}

export default compose(
	connect(
		undefined,
		{ insertBlocks, updateBlockAttributes }
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} )
)( BlockDropZone );
