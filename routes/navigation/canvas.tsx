/* @jsx createElement */
/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { createElement, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Preview, Editor, useEditorAssets } from '@wordpress/lazy-editor';
import {
	__experimentalHStack as HStack,
	Icon,
	Spinner,
} from '@wordpress/components';
import {
	privateApis as editorPrivateApis,
	getTemplatePartIcon,
} from '@wordpress/editor';
import type { WpTemplatePart } from '@wordpress/core-data';

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

const AREA_TABS = [
	{ id: 'all', label: __( 'All Template Parts' ) },
	{ id: 'header', label: __( 'Headers' ) },
	{ id: 'footer', label: __( 'Footers' ) },
	{ id: 'sidebar', label: __( 'Sidebars' ) },
	{ id: 'navigation-overlay', label: __( 'Overlays' ) },
	{ id: 'uncategorized', label: __( 'General' ) },
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

const areaField = {
	id: 'area',
	label: __( 'Area' ),
	getValue: ( { item }: { item: WpTemplatePart } ) => item.area,
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

	const fields = useMemo( () => [ previewField, titleField, areaField ], [] );

	const activeTab = useMemo( () => {
		const areaFilter = view.filters?.find(
			( f: { field: string } ) => f.field === 'area'
		) as { value?: string[] } | undefined;
		return areaFilter?.value?.[ 0 ] ?? 'all';
	}, [ view.filters ] );

	function selectTab( tabId: string ) {
		setView( ( prev ) => ( {
			...prev,
			page: 1,
			filters:
				tabId === 'all'
					? []
					: [
							{
								field: 'area',
								operator: 'isAny',
								value: [ tabId ],
							},
					  ],
		} ) );
	}

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( templateParts, view, fields ),
		[ templateParts, view, fields ]
	);

	if ( ! navigationId ) {
		return null;
	}

	return (
		<div className="navigation-canvas">
			<div className="navigation-canvas__frame navigation-canvas__frame--preview">
				<NavigationPreview navigationId={ navigationId } />
			</div>

			<div
				className={
					( view.layout as { previewSize?: number } )?.previewSize >=
					MAX_PREVIEW_SIZE
						? 'navigation-canvas__frame navigation-canvas__frame--dataviews navigation-canvas__frame--full-width'
						: 'navigation-canvas__frame navigation-canvas__frame--dataviews'
				}
			>
				<div
					className="navigation-canvas__tabs"
					role="tablist"
					aria-label={ __( 'Filter template parts by area' ) }
				>
					{ AREA_TABS.map( ( tab ) => (
						<button
							key={ tab.id }
							role="tab"
							aria-selected={ activeTab === tab.id }
							className={
								activeTab === tab.id
									? 'navigation-canvas__tab is-active'
									: 'navigation-canvas__tab'
							}
							onClick={ () => selectTab( tab.id ) }
						>
							{ tab.label }
						</button>
					) ) }
				</div>
				<div className="navigation-canvas__dataviews-scroll">
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
