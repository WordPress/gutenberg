/* @jsx createElement */
/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { useEntityRecords } from '@wordpress/core-data';
import { createElement, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Preview, Editor } from '@wordpress/lazy-editor';
import {
	DropdownMenu,
	__experimentalHStack as HStack,
	Icon,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import {
	privateApis as editorPrivateApis,
	getTemplatePartIcon,
} from '@wordpress/editor';
import type { WpTemplatePart } from '@wordpress/core-data';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useMenuUsedInTemplateParts from '../navigation-shared/use-menu-used-in-template-parts';
import { unlock } from '../lock-unlock';
import '../navigation-edit/canvas.scss';

const { patternTitleField } = unlock( editorPrivateApis );

const PatternTitle = patternTitleField.render as ( props: any ) => JSX.Element;

const titleField = {
	...patternTitleField,
	render: ( props: { item: WpTemplatePart } ) => (
		<HStack justify="flex-start" spacing={ 1 }>
			<Icon icon={ getTemplatePartIcon( props.item.area ) } size={ 24 } />
			<PatternTitle { ...props } />
		</HStack>
	),
};

const NAVIGATION_POST_TYPE = 'wp_navigation';
const LAYOUT_GRID = 'grid';
const MAX_PREVIEW_SIZE = 430;

const DEFAULT_VIEW = {
	type: LAYOUT_GRID as const,
	perPage: 20,
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	layout: { previewSize: MAX_PREVIEW_SIZE },
};

const DEFAULT_LAYOUTS = {
	[ LAYOUT_GRID ]: {},
};

const MODE_NAVIGATION = 'navigation';
const MODE_ALL = 'all';

const STATIC_AREAS = [
	{ value: 'header', label: __( 'Header' ) },
	{ value: 'footer', label: __( 'Footer' ) },
	{ value: 'sidebar', label: __( 'Sidebar' ) },
	{ value: 'navigation-overlay', label: __( 'Navigation Overlay' ) },
	{ value: 'uncategorized', label: __( 'General' ) },
] as const;

const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: ( { item }: { item: WpTemplatePart } ) => {
		return (
			<Preview
				content={ item?.content?.raw }
				blocks={ item?.blocks }
				description={ item.description }
			/>
		);
	},
	enableSorting: false,
};

function NavigationPreview( { navigationId }: { navigationId: number } ) {
	const navigate = useNavigate();
	const editLink = `/navigation/edit/${ navigationId }`;

	return (
		<div className="navigation-canvas__preview-wrap">
			<div
				style={ { height: '100%' } }
				// @ts-expect-error inert not typed properly
				inert="true"
			>
				<Editor
					postType={ NAVIGATION_POST_TYPE }
					postId={ navigationId }
					settings={ {
						isPreviewMode: true,
						styles: [ { css: 'body{min-height:100vh;}' } ],
					} }
				/>
			</div>
			<div
				onClick={ () => navigate( { to: editLink } ) }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						e.preventDefault();
						navigate( { to: editLink } );
					}
				} }
				style={ {
					position: 'absolute',
					inset: 0,
					cursor: 'pointer',
					zIndex: 1,
				} }
				role="button"
				tabIndex={ 0 }
				aria-label={ __( 'Edit navigation menu' ) }
			/>
		</div>
	);
}

function Canvas() {
	const searchParams = useSearch( { strict: false } );
	const navigate = useNavigate();

	const [ canvasMode, setCanvasMode ] = useState( MODE_NAVIGATION );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	// Get the selected navigation ID from URL params, falling back to the first navigation.
	const { records: navigationMenus } = useEntityRecords(
		'postType',
		NAVIGATION_POST_TYPE,
		{ per_page: 100, status: [ 'publish', 'draft' ], order: 'desc', orderby: 'date' }
	);

	const navigationId = useMemo( () => {
		if ( searchParams.ids?.[ 0 ] ) {
			return searchParams.ids[ 0 ] as number;
		}
		return ( navigationMenus as any[] )?.[0]?.id ?? 0;
	}, [ searchParams.ids, navigationMenus ] );

	const { templateParts, isResolving: isResolvingParts } =
		useMenuUsedInTemplateParts( navigationId );

	// Track which areas have at least one matching template part.
	const usedAreas = useMemo( () => {
		const areas = new Set< string >();
		for ( const part of templateParts as WpTemplatePart[] ) {
			if ( part.area ) {
				areas.add( part.area );
			}
		}
		return areas;
	}, [ templateParts ] );

	const currentLabel =
		canvasMode === MODE_NAVIGATION
			? __( 'Navigation Preview' )
			: canvasMode === MODE_ALL
			? __( 'All Template Parts' )
			: STATIC_AREAS.find( ( a ) => a.value === canvasMode )?.label ??
			  canvasMode;

	// Filter template parts for the DataViews based on the selected mode.
	const visibleTemplateParts = useMemo( () => {
		if ( canvasMode === MODE_ALL || canvasMode === MODE_NAVIGATION ) {
			return templateParts;
		}
		return ( templateParts as WpTemplatePart[] ).filter(
			( part ) => part.area === canvasMode
		);
	}, [ templateParts, canvasMode ] );

	const fields = useMemo( () => [ previewField, titleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( visibleTemplateParts, view, fields ),
		[ visibleTemplateParts, view, fields ]
	);

	if ( ! navigationId ) {
		return null;
	}

	return (
		<div className="navigation-canvas">
			<HStack justify="center" alignment="center" className="navigation-canvas__toolbar">
				<DropdownMenu
					label={ currentLabel }
					text={ currentLabel }
					icon={ chevronDown }
					toggleProps={ {
						iconPosition: 'right',
						className: 'navigation-canvas__mode-toggle',
						showTooltip: false,
					} }
				>
					{ ( { onClose } ) => (
						<>
							<MenuGroup>
								<MenuItem
									isSelected={ canvasMode === MODE_ALL }
									onClick={ () => {
										setCanvasMode( MODE_ALL );
										onClose();
									} }
								>
									{ __( 'All Template Parts' ) }
								</MenuItem>
								{ STATIC_AREAS.map( ( { value, label } ) => (
									<MenuItem
										key={ value }
										icon={ getTemplatePartIcon( value ) }
										isSelected={ canvasMode === value }
										disabled={ ! usedAreas.has( value ) }
										onClick={ () => {
											setCanvasMode( value );
											onClose();
										} }
									>
										{ label }
									</MenuItem>
								) ) }
							</MenuGroup>
							<MenuGroup>
								<MenuItem
									isSelected={
										canvasMode === MODE_NAVIGATION
									}
									onClick={ () => {
										setCanvasMode( MODE_NAVIGATION );
										onClose();
									} }
								>
									{ __( 'Navigation Preview' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			</HStack>

			<hr className="navigation-canvas__divider" />

			{ canvasMode === MODE_NAVIGATION ? (
				<div className="navigation-canvas__preview">
					<NavigationPreview navigationId={ navigationId } />
				</div>
			) : (
				<div
					className={
						( view.layout as { previewSize?: number } )
							?.previewSize >= MAX_PREVIEW_SIZE
							? 'navigation-canvas__dataviews navigation-canvas__dataviews--full-width'
							: 'navigation-canvas__dataviews'
					}
				>
					<DataViews
						paginationInfo={ paginationInfo }
						fields={ fields }
						data={ data ?? [] }
						isLoading={ isResolvingParts }
						view={ view }
						onChangeView={ setView }
						defaultLayouts={ DEFAULT_LAYOUTS }
						onClickItem={ ( item: WpTemplatePart ) => {
							navigate( {
								to: `/types/wp_template_part/edit/${ encodeURIComponent(
									String( item.id )
								) }`,
							} );
						} }
					>
						<DataViews.Layout />
						<DataViews.Footer />
					</DataViews>
				</div>
			) }
		</div>
	);
}

// Export as both Canvas (for React component rules) and canvas (for route framework)
export { Canvas };
export { Canvas as canvas };
