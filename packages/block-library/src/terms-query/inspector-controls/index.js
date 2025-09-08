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
// import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { unlock } from '../../lock-unlock';
import TaxonomyControl from './taxonomy-control';
import OrderControl from './order-control';
import OrderByControl from './order-by-control';
import TopLevelControl from './top-level-control';
import HideEmptyControl from './hide-empty-control';
import HierarchyControl from './hierarchy-control';
import MaxTermsControl from './max-terms-control';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const { termQuery } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { taxonomies } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const allTaxonomies = getEntityRecords( 'root', 'taxonomy' );
		return {
			taxonomies:
				allTaxonomies?.filter( ( t ) => t.visibility.public ) || [],
		};
	}, [] );

	// const { templateSlug } = useSelect( ( select ) => {
	// 	const { getEditedPostSlug } = select( editorStore );
	// 	return {
	// 		templateSlug: getEditedPostSlug(),
	// 	};
	// }, [] );

	const taxonomyOptions = taxonomies.map( ( taxonomy ) => ( {
		label: taxonomy.name,
		value: taxonomy.slug,
	} ) );

	const isTaxonomyHierarchical = taxonomies.find(
		( taxonomy ) => taxonomy.slug === termQuery.taxonomy
	)?.hierarchical;

	// const isTaxonomyMatchingTemplate = templateSlug.includes(
	// 	termQuery.taxonomy
	// );

	// const allowDisplayingSubtreeOnly =
	// 	isTaxonomyHierarchical && isTaxonomyMatchingTemplate;

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
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<TaxonomyControl
						termQuery={ termQuery }
						setQuery={ setQuery }
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

					<TopLevelControl
						termQuery={ termQuery }
						setQuery={ setQuery }
					/>

					<HierarchyControl
						termQuery={ termQuery }
						setQuery={ setQuery }
						isTaxonomyHierarchical={ isTaxonomyHierarchical }
					/>

					<MaxTermsControl
						termQuery={ termQuery }
						setQuery={ setQuery }
					/>
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
