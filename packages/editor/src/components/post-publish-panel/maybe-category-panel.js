/**
 * External dependencies
 */
import { some, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
	const categoriesTaxonomy = useSelect( coreStore ).getTaxonomy( 'category' );
	const hasNoCategory = useSelect(
		( select ) => {
			const postType = select( editorStore ).getCurrentPostType();
			const defaultCategorySlug = 'uncategorized';
			const defaultCategory = select( coreStore ).getEntityRecords(
				'taxonomy',
				'category',
				{
					slug: defaultCategorySlug,
				}
			)?.[ 0 ];
			const postTypeSupportsCategories =
				categoriesTaxonomy &&
				some( categoriesTaxonomy.types, ( type ) => type === postType );
			const categories =
				categoriesTaxonomy &&
				select( editorStore ).getEditedPostAttribute(
					categoriesTaxonomy.rest_base
				);

			// This boolean should return true if everything is loaded
			// ( categoriesTaxonomy, defaultCategory )
			// and the post has not been assigned a category different than "uncategorized".
			return (
				!! categoriesTaxonomy &&
				!! defaultCategory &&
				postTypeSupportsCategories &&
				( categories?.length === 0 ||
					( categories?.length === 1 &&
						defaultCategory.id === categories[ 0 ] ) )
			);
		},
		[ categoriesTaxonomy ]
	);
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

	const pluralName = get(
		categoriesTaxonomy,
		[ 'labels', 'name' ],
		__( 'Categories' )
	);
	const singularName = get(
		categoriesTaxonomy,
		[ 'labels', 'singular_name' ],
		__( 'Category' )
	);
	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ sprintf(
				// translators: %s: Taxonomy terms input label
				__( 'Assign a %s' ),
				singularName.toLowerCase()
			) }
		</span>,
	];

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<p>
				{ sprintf(
					// translators: %s: Taxonomy terms input description
					__(
						'%s provide a helpful way to group related posts together and to quickly tell readers what a post is about.'
					),
					pluralName
				) }
			</p>
			<HierarchicalTermSelector slug="category" />
		</PanelBody>
	);
}

export default MaybeCategoryPanel;
