/**
 * External dependencies
 */
import { get } from 'lodash';

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
	const hasNoCategory = useSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		const { canUser, getEntityRecord, getTaxonomy } = select( coreStore );
		const categoriesTaxonomy = getTaxonomy( 'category' );
		const defaultCategoryId = canUser( 'read', 'settings' )
			? getEntityRecord( 'root', 'site' )?.default_category
			: undefined;
		const defaultCategory = defaultCategoryId
			? getEntityRecord( 'taxonomy', 'category', defaultCategoryId )
			: undefined;
		const postTypeSupportsCategories =
			categoriesTaxonomy &&
			categoriesTaxonomy.types.some( ( type ) => type === postType );
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
					defaultCategory?.id === categories[ 0 ] ) )
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

	const labelWithFallback = (
		labelProperty,
		fallbackIsCategory,
		fallbackIsNotCategory
	) =>
		get(
			categoriesTaxonomy,
			[ 'labels', labelProperty ],
			categoriesTaxonomy.slug === 'category'
				? fallbackIsCategory
				: fallbackIsNotCategory
		);
	const pluralName = labelWithFallback(
		'name',
		__( 'Categories' ),
		__( 'Terms' )
	);
	const singularName = labelWithFallback(
		'singular_name',
		__( 'Category' ),
		__( 'Term' )
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
