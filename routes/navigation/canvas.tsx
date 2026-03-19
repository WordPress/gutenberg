/* @jsx createElement */
/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { createElement, Fragment, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Preview, Editor, useEditorAssets } from '@wordpress/lazy-editor';
import {
	DropdownMenu,
	__experimentalHStack as HStack,
	Icon,
	MenuGroup,
	MenuItem,
	Spinner,
} from '@wordpress/components';
import {
	privateApis as editorPrivateApis,
	getTemplatePartIcon,
} from '@wordpress/editor';
import type { WpTemplatePart } from '@wordpress/core-data';
import {
	check,
	chevronDown,
	navigation as navigationIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useMenuUsedInTemplateParts from './use-menu-used-in-template-parts';
import { unlock } from '../lock-unlock';
import './canvas.scss';

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

const MODE_ALL = 'all';

const STATIC_AREAS = [
	{ value: 'header', label: __( 'Header' ) },
	{ value: 'navigation-overlay', label: __( 'Navigation Overlay' ) },
	{ value: 'footer', label: __( 'Footer' ) },
	{ value: 'sidebar', label: __( 'Panel' ) },
	{ value: 'uncategorized', label: __( 'General' ) },
] as const;

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

const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: ( { item }: { item: WpTemplatePart } ) => (
		<Preview
			content={ item?.content?.raw }
			blocks={ item?.blocks }
			description={ item.description }
		/>
	),
	enableSorting: false,
};

function getAreaLabel( area: string ): string {
	if ( area === MODE_ALL ) {
		return __( 'All Template Parts' );
	}
	return STATIC_AREAS.find( ( a ) => a.value === area )?.label ?? area;
}

function NavigationPreview( { navigationId }: { navigationId: number } ) {
	const navigate = useNavigate();
	const { isReady: assetsReady } = useEditorAssets();
	const editLink = `/types/wp_navigation/edit/${ navigationId }`;

	return (
		<div className="navigation-canvas__nav-card">
			<div className="navigation-canvas__nav-card__media">
				{ ! assetsReady ? (
					<div className="navigation-canvas__nav-card__spinner">
						<Spinner />
					</div>
				) : (
					<>
						<div
							style={ { height: '100%' } }
							// @ts-expect-error inert not typed properly
							inert="true"
						>
							<Editor
								key={ navigationId }
								postType={ NAVIGATION_POST_TYPE }
								postId={ navigationId }
								settings={ {
									isPreviewMode: true,
									styles: [
										{ css: 'body{min-height:100vh;}' },
									],
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
								zIndex: 9999,
							} }
							role="button"
							tabIndex={ 0 }
							aria-label={ __( 'Edit navigation menu' ) }
						/>
					</>
				) }
			</div>
			<div className="navigation-canvas__nav-card__title">
				<Icon icon={ navigationIcon } size={ 24 } />
				<span>{ __( 'Navigation Block Editor' ) }</span>
			</div>
		</div>
	);
}

function Canvas() {
	const searchParams = useSearch( { strict: false } );
	const navigate = useNavigate();

	// showPreview: absent or '1' = shown (default), '0' = hidden.
	// canvas: absent = MODE_ALL (default), 'none' = hidden, otherwise area value.
	const showPreview = ( searchParams as any ).preview !== '0';
	const canvasParam = ( searchParams as any ).canvas as string | undefined;
	const templateArea: string | null =
		canvasParam === 'none' ? null : ( canvasParam ?? MODE_ALL );

	function setShowPreview( next: boolean ) {
		navigate( {
			search: { ...searchParams, preview: next ? undefined : '0' },
			replace: true,
		} );
	}

	function setTemplateArea( next: string | null ) {
		navigate( {
			search: {
				...searchParams,
				canvas: next === null ? 'none' : next === MODE_ALL ? undefined : next,
			},
			replace: true,
		} );
	}

	const [ view, setView ] = useState( DEFAULT_VIEW );

	const navigationId = useMemo( () => {
		const editId = ( searchParams as any ).editId as number | undefined;
		if ( editId ) {
			return editId;
		}
		if ( searchParams.ids?.[ 0 ] ) {
			return searchParams.ids[ 0 ] as number;
		}
		return 0;
	}, [ searchParams ] );

	const { templateParts, isResolving: isResolvingParts } =
		useMenuUsedInTemplateParts( navigationId );

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
		[
			showPreview ? __( 'Navigation Preview' ) : null,
			templateArea ? getAreaLabel( templateArea ) : null,
		]
			.filter( Boolean )
			.join( ', ' ) || __( 'None' );

	const areaOrder = useMemo(
		() =>
			Object.fromEntries(
				STATIC_AREAS.map( ( { value }, index ) => [ value, index ] )
			),
		[]
	);

	const visibleTemplateParts = useMemo( () => {
		const filtered =
			! templateArea || templateArea === MODE_ALL
				? ( templateParts as WpTemplatePart[] )
				: ( templateParts as WpTemplatePart[] ).filter(
						( part ) => part.area === templateArea
				  );
		return [ ...filtered ].sort(
			( a, b ) =>
				( areaOrder[ a.area ] ?? 99 ) - ( areaOrder[ b.area ] ?? 99 )
		);
	}, [ templateParts, templateArea, areaOrder ] );

	const fields = useMemo( () => [ previewField, titleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( visibleTemplateParts, view, fields ),
		[ visibleTemplateParts, view, fields ]
	);

	const showTemplateParts = !! templateArea;

	if ( ! navigationId ) {
		return null;
	}

	return (
		<div className="navigation-canvas">
			<HStack
				justify="center"
				alignment="center"
				className="navigation-canvas__toolbar"
			>
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
					{ () => (
						<Fragment>
							<MenuGroup>
								<MenuItem
									icon={ showPreview ? check : undefined }
									role="menuitemcheckbox"
									isSelected={ showPreview }
									onClick={ () =>
										setShowPreview( ! showPreview )
									}
								>
									{ __( 'Navigation Preview' ) }
								</MenuItem>
							</MenuGroup>
							<MenuGroup>
								<MenuItem
									icon={
										templateArea === MODE_ALL
											? check
											: undefined
									}
									role="menuitemradio"
									isSelected={ templateArea === MODE_ALL }
									onClick={ () =>
										setTemplateArea(
											templateArea === MODE_ALL
												? null
												: MODE_ALL
										)
									}
								>
									{ __( 'All Template Parts' ) }
								</MenuItem>
								{ STATIC_AREAS.map( ( { value, label } ) => (
									<MenuItem
										key={ value }
										icon={
											templateArea === value
												? check
												: undefined
										}
										role="menuitemradio"
										isSelected={ templateArea === value }
										disabled={ ! usedAreas.has( value ) }
										onClick={ () =>
											setTemplateArea(
												templateArea === value
													? null
													: value
											)
										}
									>
										{ label }
									</MenuItem>
								) ) }
							</MenuGroup>
						</Fragment>
					) }
				</DropdownMenu>
			</HStack>

			<hr className="navigation-canvas__divider" />

			{ showPreview && (
				<div className="navigation-canvas__preview">
					<NavigationPreview navigationId={ navigationId } />
				</div>
			) }

			{ showTemplateParts && (
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
