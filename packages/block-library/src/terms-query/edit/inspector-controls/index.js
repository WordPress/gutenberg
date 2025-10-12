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
import NestedTermsControl from './nested-terms-control';
import InheritControl from './inherit-control';
import MaxTermsControl from './max-terms-control';
import AdvancedControls from './advanced-controls';

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	clientId,
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

	// Only display the showNested control if the taxonomy is hierarchical and not inheriting.
	const displayShowNestedControl =
		isTaxonomyHierarchical && ! termQuery.inherit;

	// Labels shared between ToolsPanelItem and its child control.
	const taxonomyControlLabel = __( 'Taxonomy' );
	const orderByControlLabel = __( 'Order by' );
	const emptyTermsControlLabel = __( 'Show empty terms' );
	const inheritControlLabel = __( 'Inherit parent term from archive' );
	const nestedTermsControlLabel = __( 'Show nested terms' );
	const maxTermsControlLabel = __( 'Max terms' );

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
								showNested: false,
								parent: false,
								perPage: 10,
							},
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
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
					{ displayInheritControl && (
						<ToolsPanelItem
							hasValue={ () => inherit !== false }
							label={ inheritControlLabel }
							onDeselect={ () => setQuery( { inherit: false } ) }
							isShownByDefault
						>
							<InheritControl
								label={ inheritControlLabel }
								value={ inherit }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
					) }
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
