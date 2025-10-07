/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../../utils/hooks';
import { usePublicTaxonomies } from '../../utils';
import TaxonomyControl from './taxonomy-control';
import OrderingControls from './ordering-controls';
import EmptyTermsControl from './empty-terms-control';
import HierarchyControl from './hierarchy-control';
import InheritControl from './inherit-control';
import MaxTermsControl from './max-terms-control';
import AdvancedControls from './advanced-controls';

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const { termQuery } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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

	const taxonomies = usePublicTaxonomies();

	const isTaxonomyHierarchical = taxonomies.find(
		( taxonomy ) => taxonomy.slug === termQuery.taxonomy
	)?.hierarchical;

	const isTaxonomyMatchingTemplate =
		typeof templateSlug === 'string' &&
		templateSlug.includes( termQuery.taxonomy );

	// Only display the inherit control if the taxonomy is hierarchical and matches the current template.
	const displayInheritControl =
		isTaxonomyHierarchical && isTaxonomyMatchingTemplate;

	// Only display the hierarchical control if the taxonomy is hierarchical and not inheriting.
	const displayHierarchicalControl =
		isTaxonomyHierarchical && ! termQuery.inherit;

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
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<TaxonomyControl
						attributes={ attributes }
						setQuery={ setQuery }
						setAttributes={ setAttributes }
					/>
					<OrderingControls
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<EmptyTermsControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					{ displayInheritControl && (
						<InheritControl
							attributes={ attributes }
							setAttributes={ setAttributes }
						/>
					) }
					{ displayHierarchicalControl && (
						<HierarchyControl
							attributes={ attributes }
							setQuery={ setQuery }
						/>
					) }
					<MaxTermsControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
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
