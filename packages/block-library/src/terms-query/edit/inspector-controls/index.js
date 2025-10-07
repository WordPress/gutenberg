/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../../utils/hooks';
import TaxonomyControl from './taxonomy-control';
import OrderingControls from './ordering-controls';
import DisplayOptions from './display-options';
import HierarchyControl from './hierarchy-control';
import EmptyTermsControl from './empty-terms-control';
import MaxTermsControl from './max-terms-control';
import AdvancedControls from './advanced-controls';

const usePublicTaxonomies = () => {
	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return (
			taxonomies?.filter(
				( { visibility } ) => visibility?.publicly_queryable
			) || []
		);
	}, [ taxonomies ] );
};

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const { termQuery, termsToShow } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const taxonomies = usePublicTaxonomies();

	const { templateSlug } = useSelect( ( select ) => {
		// @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor, so to avoid
		// declaring @wordpress/editor as a dependency, we must access its
		// store by string.
		// The solution here is to split WP specific blocks from generic blocks.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getEditedPostSlug } = select( 'core/editor' );
		return {
			templateSlug: getEditedPostSlug(),
		};
	}, [] );

	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	const isTaxonomyHierarchical = taxonomies.find(
		( taxonomy ) => taxonomy.slug === termQuery.taxonomy
	)?.hierarchical;

	const isTaxonomyMatchingTemplate =
		typeof templateSlug === 'string' &&
		templateSlug.includes( termQuery.taxonomy );

	const displaySubtermsControl =
		isTaxonomyHierarchical && isTaxonomyMatchingTemplate;

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Terms Query Settings' ) }
					resetAll={ () => {
						setAttributes( {
							termQuery: {
								taxonomy: 'category',
								order: 'asc',
								orderBy: 'name',
								hideEmpty: true,
								hierarchical: false,
								parent: false,
								perPage: 10,
							},
							termsToShow: 'all',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<TaxonomyControl
						attributes={ attributes }
						setQuery={ setQuery }
						setAttributes={ setAttributes }
						taxonomyOptions={ taxonomyOptions }
					/>
					<OrderingControls
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<EmptyTermsControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<DisplayOptions
						attributes={ attributes }
						setAttributes={ setAttributes }
						displayTopLevelControl={ isTaxonomyHierarchical }
						displaySubtermsControl={ displaySubtermsControl }
					/>
					<MaxTermsControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					{ isTaxonomyHierarchical && termsToShow === 'all' && (
						<HierarchyControl
							attributes={ attributes }
							setQuery={ setQuery }
						/>
					) }
				</ToolsPanel>
			</InspectorControls>
			<AdvancedControls
				TagName={ TagName }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
		</>
	);
}
