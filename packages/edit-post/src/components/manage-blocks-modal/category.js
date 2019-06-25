/**
 * External dependencies
 */
import { without, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withInstanceId } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesChecklist from './checklist';

function BlockManagerCategory( {
	instanceId,
	category,
	blockTypes,
	hiddenBlockTypes,
	toggleVisible,
	toggleAllVisible,
} ) {
	if ( ! blockTypes.length ) {
		return null;
	}

	const checkedBlockNames = without(
		map( blockTypes, 'name' ),
		...hiddenBlockTypes
	);

	const titleId = 'edit-post-manage-blocks-modal__category-title-' + instanceId;

	const isAllChecked = checkedBlockNames.length === blockTypes.length;

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
			className="edit-post-manage-blocks-modal__category"
		>
			<CheckboxControl
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="edit-post-manage-blocks-modal__category-title"
				aria-checked={ ariaChecked }
				label={ <span id={ titleId }>{ category.title }</span> }
			/>
			<BlockTypesChecklist
				blockTypes={ blockTypes }
				value={ checkedBlockNames }
				onItemChange={ toggleVisible }
			/>
		</div>
	);
}

export default compose( [
	withInstanceId,
	withSelect( ( select ) => {
		const { getPreference } = select( 'core/edit-post' );

		return {
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			showBlockTypes,
			hideBlockTypes,
		} = dispatch( 'core/edit-post' );

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
