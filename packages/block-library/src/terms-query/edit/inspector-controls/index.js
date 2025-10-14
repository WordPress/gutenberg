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
	setAttributes,
	clientId,
	context,
	setQuery,
} ) {
	const { termQuery, tagName: TagName } = attributes;
	const {
		taxonomy,
		orderBy,
		order,
		hideEmpty,
		showNested,
		perPage,
		inherit,
	} = termQuery;
	const { postId, templateSlug } = context;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const taxonomies = usePublicTaxonomies();

	const isTaxonomyHierarchical = taxonomies.find(
		( _taxonomy ) => _taxonomy.slug === taxonomy
	)?.hierarchical;

	const isTaxonomyMatchingTemplate = templateSlug?.startsWith(
		// `Tags` are a special case in WP template hierarchy.
		taxonomy === 'post_tag' ? 'tag' : taxonomy
	);

	const isSinglePostContext =
		!! postId || templateSlug?.startsWith( 'single' );

	// Only display the inherit control if the taxonomy is hierarchical and matches the current template or a post is available.
	const displayInheritControl =
		( isTaxonomyHierarchical && isTaxonomyMatchingTemplate ) ||
		isSinglePostContext;

	// Only display the show nested control if the taxonomy is hierarchical and not inheriting.
	const displayShowNestedControl =
		isTaxonomyHierarchical && termQuery.parent === false;

	const inheritingFromPost = inherit && isSinglePostContext;

	// Labels shared between ToolsPanelItem and its child control.
	const taxonomyControlLabel = __( 'Taxonomy' );
	const orderByControlLabel = __( 'Order by' );
	const emptyTermsControlLabel = __( 'Show empty terms' );
	const inheritControlLabel = isSinglePostContext
		? __( 'Inherit terms from post' )
		: __( 'Inherit parent term from archive' );
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
							disabled={ inheritingFromPost }
							help={
								inheritingFromPost
									? __(
											'When inheriting terms from a post, empty terms are not shown.'
									  )
									: undefined
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
								onChange={ ( value ) => {
									setQuery( {
										inherit: value,
										// When enabling inherit, showNested is not supported for posts.
										...( value
											? {
													showNested:
														! isSinglePostContext,
											  }
											: {} ),
										// If inheriting from a post, hideEmpty is irrelevant but UI should reflect that no empty terms should be shown.
										...( value && isSinglePostContext
											? { hideEmpty: true }
											: {} ),
									} );
								} }
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
