/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HierarchicalTermSelector from '../post-taxonomies/hierarchical-term-selector';
import { store as editorStore } from '../../store';

function MaybeCategoryPanel() {
	const hasNoCategory = useSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		const categoriesTaxonomy = select( coreStore ).getTaxonomy(
			'category'
		);
		const defaultCategorySlug = 'uncategorized';
		const defaultCategory = select( coreStore ).getEntityRecords(
			'taxonomy',
			'category',
			{
				slug: defaultCategorySlug,
			}
		)?.[ 0 ];

		const categories =
			categoriesTaxonomy &&
			select( editorStore ).getEditedPostAttribute(
				categoriesTaxonomy.rest_base
			);

		return (
			categoriesTaxonomy !== undefined &&
			defaultCategory &&
			some( categoriesTaxonomy.types, ( type ) => type === postType ) &&
			( categories?.length === 0 ||
				( categories?.length === 1 &&
					defaultCategory.id === categories[ 0 ] ) )
		);
	}, [] );
	const [ shouldShowPanel, setShouldShowPanel ] = useState( false );
	useEffect( () => {
		// We use state to avoid hiding the panel if the user edits the categories
		// and adds one within the panel itself (while visible).
		if ( hasNoCategory ) {
			setShouldShowPanel( true );
		}
	}, [ hasNoCategory ] );

	if ( ! shouldShowPanel ) {
		return null;
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Assign a category' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<HierarchicalTermSelector slug="category" />
		</PanelBody>
	);
}

export default MaybeCategoryPanel;
