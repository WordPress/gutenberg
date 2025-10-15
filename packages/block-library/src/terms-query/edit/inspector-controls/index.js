/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../../utils/hooks';
import { usePublicTaxonomies } from '../../utils';
import TaxonomyControl from './taxonomy-control';
import OrderControl from './order-control';
import EmptyTermsControl from './empty-terms-control';
import NestedTermsControl from './nested-terms-control';
import InheritControl from './inherit-control';
import MaxTermsControl from './max-terms-control';
import AdvancedControls from './advanced-controls';

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	clientId,
	templateSlug,
} ) {
	const { termQuery, tagName: TagName } = attributes;
	const {
		taxonomy,
		orderBy,
		order,
		hideEmpty,
		inherit,
		showNested,
		perPage,
	} = termQuery;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const taxonomies = usePublicTaxonomies();

	const isTaxonomyHierarchical = taxonomies.find(
		( _taxonomy ) => _taxonomy.slug === taxonomy
	)?.hierarchical;

	// Display the inherit control when we're in a taxonomy-related
	// template (category, tag, or custom taxonomy).
	const displayInheritControl =
		[ 'taxonomy', 'category', 'tag', 'archive' ].includes( templateSlug ) ||
		templateSlug?.startsWith( 'taxonomy-' ) ||
		templateSlug?.startsWith( 'category-' ) ||
		templateSlug?.startsWith( 'tag-' );

	// Only display the showNested control if the taxonomy is hierarchical and not inheriting.
	const displayShowNestedControl =
		isTaxonomyHierarchical && ! termQuery.inherit;

	// Only display the taxonomy control when not inheriting (custom query type).
	const displayTaxonomyControl = ! termQuery.inherit;

	// Labels shared between ToolsPanelItem and its child control.
	const queryTypeControlLabel = __( 'Query type' );
	const taxonomyControlLabel = __( 'Taxonomy' );
	const orderByControlLabel = __( 'Order by' );
	const emptyTermsControlLabel = __( 'Show empty terms' );
	const nestedTermsControlLabel = __( 'Show nested terms' );
	const maxTermsControlLabel = __( 'Max terms' );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							termQuery: {
								taxonomy: 'category',
								order: 'asc',
								orderBy: 'name',
								hideEmpty: true,
								showNested: false,
								inherit: false,
								parent: false,
								perPage: 10,
							},
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ displayInheritControl && (
						<ToolsPanelItem
							hasValue={ () => inherit !== false }
							label={ queryTypeControlLabel }
							onDeselect={ () => setQuery( { inherit: false } ) }
							isShownByDefault
						>
							<InheritControl
								label={ queryTypeControlLabel }
								value={ inherit }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
					) }
					{ displayTaxonomyControl && (
						<ToolsPanelItem
							hasValue={ () => taxonomy !== 'category' }
							label={ taxonomyControlLabel }
							onDeselect={ () => {
								setQuery( { taxonomy: 'category' } );
							} }
							isShownByDefault
						>
							<TaxonomyControl
								label={ taxonomyControlLabel }
								value={ taxonomy }
								onChange={ ( value ) =>
									setQuery( { taxonomy: value } )
								}
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => orderBy !== 'name' || order !== 'asc' }
						label={ orderByControlLabel }
						onDeselect={ () =>
							setQuery( { orderBy: 'name', order: 'asc' } )
						}
						isShownByDefault
					>
						<OrderControl
							label={ orderByControlLabel }
							{ ...{ orderBy, order } }
							onChange={ ( newOrderBy, newOrder ) => {
								setQuery( {
									orderBy: newOrderBy,
									order: newOrder,
								} );
							} }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => hideEmpty !== true }
						label={ emptyTermsControlLabel }
						onDeselect={ () => setQuery( { hideEmpty: true } ) }
						isShownByDefault
					>
						<EmptyTermsControl
							label={ emptyTermsControlLabel }
							value={ hideEmpty }
							onChange={ ( value ) =>
								setQuery( { hideEmpty: value } )
							}
						/>
					</ToolsPanelItem>
					{ displayShowNestedControl && (
						<ToolsPanelItem
							hasValue={ () => showNested !== false }
							label={ nestedTermsControlLabel }
							onDeselect={ () =>
								setQuery( { showNested: false } )
							}
							isShownByDefault
						>
							<NestedTermsControl
								label={ nestedTermsControlLabel }
								value={ showNested }
								onChange={ ( value ) =>
									setQuery( { showNested: value } )
								}
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => perPage !== 10 }
						label={ maxTermsControlLabel }
						onDeselect={ () => setQuery( { perPage: 10 } ) }
						isShownByDefault
					>
						<MaxTermsControl
							label={ maxTermsControlLabel }
							value={ perPage }
							onChange={ ( value ) =>
								setQuery( { perPage: value } )
							}
						/>
					</ToolsPanelItem>
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
