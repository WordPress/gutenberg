/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { reduce, get, find, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone, withContext } from '@wordpress/components';
import { getBlockTypes, rawHandler, cloneBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { insertBlocks, updateBlockAttributes } from '../../store/actions';

function BlockDropZone( { index, isLocked, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const getInsertIndex = ( position ) => {
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
			const insertIndex = getInsertIndex( position );
			const blocks = transformation.transform( files, props.updateBlockAttributes );
			props.insertBlocks( blocks, insertIndex );
		}
	};

	const onHTMLDrop = ( HTML, position ) => {
		const blocks = rawHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			props.insertBlocks( blocks, getInsertIndex( position ) );
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
			};
		}
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} )
)( BlockDropZone );
