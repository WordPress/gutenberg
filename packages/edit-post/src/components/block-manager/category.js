/**
 * External dependencies
 */
import { includes, map, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withInstanceId } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesChecklist from './checklist';
import EditPostSettings from '../edit-post-settings';
import { store as editPostStore } from '../../store';

function BlockManagerCategory( {
	instanceId,
	title,
	blockTypes,
	hiddenBlockTypes,
	toggleVisible,
	toggleAllVisible,
} ) {
	const settings = useContext( EditPostSettings );
	const { allowedBlockTypes } = settings;
	const filteredBlockTypes = useMemo( () => {
		if ( allowedBlockTypes === true ) {
			return blockTypes;
		}
		return blockTypes.filter( ( { name } ) => {
			return includes( allowedBlockTypes || [], name );
		} );
	}, [ allowedBlockTypes, blockTypes ] );

	if ( ! filteredBlockTypes.length ) {
		return null;
	}

	const checkedBlockNames = without(
		map( filteredBlockTypes, 'name' ),
		...hiddenBlockTypes
	);

	const titleId = 'edit-post-block-manager__category-title-' + instanceId;

	const isAllChecked = checkedBlockNames.length === filteredBlockTypes.length;

	let ariaChecked;
	if ( isAllChecked ) {
		ariaChecked = 'true';
	} else if ( checkedBlockNames.length > 0 ) {
		ariaChecked = 'mixed';
	} else {
		ariaChecked = 'false';
	}

	return (
		<div
			role="group"
			aria-labelledby={ titleId }
			className="edit-post-block-manager__category"
		>
			<CheckboxControl
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="edit-post-block-manager__category-title"
				aria-checked={ ariaChecked }
				label={ <span id={ titleId }>{ title }</span> }
			/>
			<BlockTypesChecklist
				blockTypes={ filteredBlockTypes }
				value={ checkedBlockNames }
				onItemChange={ toggleVisible }
			/>
		</div>
	);
}

export default compose( [
	withInstanceId,
	withSelect( ( select ) => {
		const { getPreference } = select( editPostStore );

		return {
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { showBlockTypes, hideBlockTypes } = dispatch( editPostStore );

		return {
			toggleVisible( blockName, nextIsChecked ) {
				if ( nextIsChecked ) {
					showBlockTypes( blockName );
				} else {
					hideBlockTypes( blockName );
				}
			},
			toggleAllVisible( nextIsChecked ) {
				const blockNames = map( ownProps.blockTypes, 'name' );
				if ( nextIsChecked ) {
					showBlockTypes( blockNames );
				} else {
					hideBlockTypes( blockNames );
				}
			},
		};
	} ),
] )( BlockManagerCategory );
