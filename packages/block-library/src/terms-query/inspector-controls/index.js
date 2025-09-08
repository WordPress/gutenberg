/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import {
	InspectorControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { unlock } from '../../lock-unlock';
import TaxonomyControl from './taxonomy-control';
import OrderControl from './order-control';
import OrderByControl from './order-by-control';
import HideEmptyControl from './hide-empty-control';
import HierarchyControl from './hierarchy-control';
import MaxTermsControl from './max-terms-control';
import TermSelectionControl from './term-selection-control';
import ShowSubtreeControl from './show-subtree-control';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const { termQuery, termsSelection } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { taxonomies } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const allTaxonomies = getEntityRecords( 'root', 'taxonomy' );
		return {
			taxonomies:
				allTaxonomies?.filter( ( t ) => t.visibility.public ) || [],
		};
	}, [] );

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

	const isTaxonomyMatchingTemplate = templateSlug.includes(
		termQuery.taxonomy
	);

	// Display subtree only control if
	// - taxonomy is hierarchical and
	// - taxonomy is matching template (e.g. category template).
	const displaySubtreeOnlyContol =
		isTaxonomyHierarchical && isTaxonomyMatchingTemplate;

	// Display taxonomy to show control if
	// - subtree only is not displayed or
	// - subtree only is displayed and is disabled.
	const displayTermSelectionControl =
		! displaySubtreeOnlyContol || ! termsSelection === 'subtree';

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
								parent: 0,
								perPage: 10,
							},
							termsSelection: 'all',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<TaxonomyControl
						termQuery={ termQuery }
						setAttributes={ setAttributes }
						taxonomyOptions={ taxonomyOptions }
					/>

					<OrderControl
						termQuery={ termQuery }
						setQuery={ setQuery }
					/>

					<OrderByControl
						termQuery={ termQuery }
						setQuery={ setQuery }
					/>

					<HideEmptyControl
						termQuery={ termQuery }
						setQuery={ setQuery }
					/>

					{ displaySubtreeOnlyContol && (
						<ShowSubtreeControl
							showSubtree={ termsSelection === 'subtree' }
							setAttributes={ setAttributes }
						/>
					) }

					{ displayTermSelectionControl && (
						<TermSelectionControl
							termsSelection={ termsSelection }
							setAttributes={ setAttributes }
							termQuery={ termQuery }
							setQuery={ setQuery }
						/>
					) }

					{ termsSelection === 'all' ||
						( termsSelection === 'top-level' && (
							<MaxTermsControl
								termQuery={ termQuery }
								setQuery={ setQuery }
							/>
						) ) }

					{ isTaxonomyHierarchical && (
						<HierarchyControl
							termQuery={ termQuery }
							setQuery={ setQuery }
							isTaxonomyHierarchical={ isTaxonomyHierarchical }
						/>
					) }
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					clientId={ clientId }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
				/>
			</InspectorControls>
		</>
	);
}
