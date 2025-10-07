/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../../utils/hooks';
import { usePublicTaxonomies } from '../../utils';
import TaxonomyControl from './taxonomy-control';
import OrderControl from './order-control';
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
	const { taxonomy, orderBy, order, hideEmpty, inherit } = termQuery;
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
		( _taxonomy ) => _taxonomy.slug === taxonomy
	)?.hierarchical;

	const isTaxonomyMatchingTemplate =
		typeof templateSlug === 'string' && templateSlug.includes( taxonomy );

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
					<ToolsPanelItem
						hasValue={ () => taxonomy !== 'category' }
						label={ __( 'Taxonomy' ) }
						onDeselect={ () => {
							setQuery( { taxonomy: 'category' } );
						} }
						isShownByDefault
					>
						<TaxonomyControl
							taxonomy={ taxonomy }
							onChange={ ( value ) =>
								setQuery( { taxonomy: value } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => orderBy !== 'name' || order !== 'asc' }
						label={ __( 'Order by' ) }
						onDeselect={ () =>
							setQuery( { orderBy: 'name', order: 'asc' } )
						}
						isShownByDefault
					>
						<OrderControl
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
						label={ __( 'Show empty terms' ) }
						onDeselect={ () => setQuery( { hideEmpty: true } ) }
						isShownByDefault
					>
						<EmptyTermsControl
							hideEmpty={ hideEmpty }
							onChange={ ( value ) =>
								setQuery( { hideEmpty: value } )
							}
						/>
					</ToolsPanelItem>
					{ displayInheritControl && (
						<ToolsPanelItem
							hasValue={ () => inherit !== false }
							label={ __( 'Inherit parent term from archive' ) }
							onDeselect={ () => setQuery( { inherit: false } ) }
							isShownByDefault
						>
							<InheritControl
								inherit={ inherit }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
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
