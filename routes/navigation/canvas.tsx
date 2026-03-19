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
import { chevronDown } from '@wordpress/icons';

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
	{ value: 'footer', label: __( 'Footer' ) },
	{ value: 'sidebar', label: __( 'Panel' ) },
	{ value: 'navigation-overlay', label: __( 'Navigation Overlay' ) },
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

function NavigationPreview( { navigationId }: { navigationId: number } ) {
	const navigate = useNavigate();
	const { isReady: assetsReady } = useEditorAssets();
	const editLink = `/types/wp_navigation/edit/${ navigationId }`;

	if ( ! assetsReady ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
				} }
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div className="navigation-canvas__preview-wrap">
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
					zIndex: 9999,
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

	const canvasMode = ( searchParams as any ).canvas ?? MODE_ALL;
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
		canvasMode === MODE_ALL
			? __( 'All Template Parts' )
			: STATIC_AREAS.find( ( a ) => a.value === canvasMode )?.label ??
			  canvasMode;

	const visibleTemplateParts = useMemo( () => {
		if ( canvasMode === MODE_ALL ) {
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
			<div className="navigation-canvas__frame navigation-canvas__frame--preview">
				<NavigationPreview navigationId={ navigationId } />
			</div>

			<div className="navigation-canvas__frame navigation-canvas__frame--dataviews">
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
						{ ( { onClose } ) => (
							<Fragment>
								<MenuGroup>
									<MenuItem
										isSelected={ canvasMode === MODE_ALL }
										onClick={ () => {
											navigate( {
												search: {
													...searchParams,
													canvas: MODE_ALL,
												},
											} );
											onClose();
										} }
									>
										{ __( 'All Template Parts' ) }
									</MenuItem>
									{ STATIC_AREAS.map(
										( { value, label } ) => (
											<MenuItem
												key={ value }
												icon={ getTemplatePartIcon(
													value
												) }
												isSelected={
													canvasMode === value
												}
												disabled={
													! usedAreas.has( value )
												}
												onClick={ () => {
													navigate( {
														search: {
															...searchParams,
															canvas: value,
														},
													} );
													onClose();
												} }
											>
												{ label }
											</MenuItem>
										)
									) }
								</MenuGroup>
							</Fragment>
						) }
					</DropdownMenu>
				</HStack>

				<hr className="navigation-canvas__divider" />

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
			</div>
		</div>
	);
}

// Export as both Canvas (for React component rules) and canvas (for route framework)
export { Canvas };
export { Canvas as canvas };
