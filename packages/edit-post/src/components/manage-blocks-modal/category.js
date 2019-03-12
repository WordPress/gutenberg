/**
 * External dependencies
 */
import { without, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockManagerHideAll from './hide-all';
import BlockTypesChecklist from './checklist';

function BlockManagerCategory( {
	category,
	blockTypes,
	hiddenBlockTypes,
	toggleVisible,
	toggleAllHidden,
} ) {
	if ( ! blockTypes.length ) {
		return null;
	}

	const checkedBlockNames = without(
		map( blockTypes, 'name' ),
		...hiddenBlockTypes
	);

	return (
		<section className="edit-post-manage-blocks-modal__category">
			<header className="edit-post-manage-blocks-modal__category-header">
				<h2 className="edit-post-manage-blocks-modal__category-title">
					{ category.title }
				</h2>
				<BlockManagerHideAll
					category={ category }
					checked={ ! checkedBlockNames.length }
					onChange={ toggleAllHidden }
				/>
			</header>
			<BlockTypesChecklist
				blockTypes={ blockTypes }
				value={ checkedBlockNames }
				onItemChange={ toggleVisible }
			/>
		</section>
	);
}

export default compose( [
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
			toggleAllHidden( nextIsChecked ) {
				const blockNames = map( ownProps.blockTypes, 'name' );
				if ( nextIsChecked ) {
					hideBlockTypes( blockNames );
				} else {
					showBlockTypes( blockNames );
				}
			},
		};
	} ),
] )( BlockManagerCategory );
