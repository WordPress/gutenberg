/**
 * WordPress dependency
 */
import { BlockEdit, getBlockType } from '@wordpress/blocks';
import { query } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { getWrapperDisplayName } from '@wordpress/element';

/**
 * Internal dependency
 */
import './style.scss';
import { REDUCER_KEY } from '../store';

const withFrozenMode = ( BloclListBlock ) => {
	const WrappedBlockItem = ( { collaboratorColor, collaboratorName, isFrozenByCollaborator, ...props } ) => {
		if ( ! isFrozenByCollaborator ) {
			return <BloclListBlock { ...props } />;
		}

		const { block } = props;
		const { attributes, name, isValid, uid } = block;
		const blockType = getBlockType( name );

		// Determine whether the block has props to apply to the wrapper.
		let wrapperProps;
		if ( blockType.getEditWrapperProps ) {
			wrapperProps = blockType.getEditWrapperProps( attributes );
		}

		return (
			<div
				className={ `editor-block-list__block is-frozen-by-collaborator is-${ collaboratorColor }` }
				{ ...wrapperProps }
			>
				<legend className="coediting-legend">{ collaboratorName }</legend>
				<div className="editor-block-list__block-edit">
					{ isValid && <BlockEdit
						attributes={ attributes }
						id={ uid }
						name={ name }
					/> }
				</div>
			</div>
		);
	};
	WrappedBlockItem.displayName = getWrapperDisplayName( BloclListBlock, 'frozen-mode' );

	const mapSelectorsToProps = ( select, { uid } ) => ( {
		collaboratorColor: select( REDUCER_KEY, 'getFrozenBlockCollaboratorColor', uid ),
		collaboratorName: select( REDUCER_KEY, 'getFrozenBlockCollaboratorName', uid ),
		isFrozenByCollaborator: select( REDUCER_KEY, 'isBlockFrozenByCollaborator', uid ),
	} );

	return query( mapSelectorsToProps )( WrappedBlockItem );
};

addFilter( 'editor.BlockListBlock', 'coediting/block-item/frozen-mode', withFrozenMode );
