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
import BlockManagerShowAll from './show-all';
import BlockTypesChecklist from './checklist';

function BlockManagerCategory( {
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

	return (
		<section className="edit-post-manage-blocks-modal__category">
			<header className="edit-post-manage-blocks-modal__category-header">
				<h2 className="edit-post-manage-blocks-modal__category-title">
					{ category.title }
				</h2>
				<BlockManagerShowAll
					category={ category }
					checked={ checkedBlockNames.length > 0 }
					onChange={ toggleAllVisible }
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
