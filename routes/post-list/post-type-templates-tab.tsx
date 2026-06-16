/**
 * WordPress dependencies
 */
import { useNavigate, useSearch, useInvalidate, Link } from '@wordpress/route';
import { useView } from '@wordpress/views';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
	type WpTemplate,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import {
	DEFAULT_TEMPLATE_LAYOUTS,
	DEFAULT_TEMPLATE_VIEW,
	getTemplateViewSlug,
} from './view-utils';
import { PostListDataViewsLayout } from './dataviews-layout';
import { previewField } from '../template-list/fields/preview';
import { authorField } from '../template-list/fields/author';
import { descriptionField } from '../template-list/fields/description';
import { activeField } from '../template-list/fields/active';
import { slugField } from '../template-list/fields/slug';
import {
	TemplateItemPreview,
	TemplateItemTitle,
} from './template-item-renderers';

/**
 * Style dependencies
 */
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../template-list/style.scss';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { templateTitleField } = unlock( editorPrivateApis );

type PageTemplateRecord = WpTemplate & {
	author_text?: string;
	is_custom?: boolean;
	meta?: {
		is_wp_suggestion?: boolean;
	};
	theme?: string;
	_isActive?: boolean;
	_isCustom?: boolean;
};

const PreviewRender = previewField.render as ComponentType< {
	item: PageTemplateRecord;
} >;
const TemplateTitleRender = templateTitleField.render as ComponentType< {
	item: PageTemplateRecord;
} >;

interface PostTypeTemplatesTabProps {
	postType: string;
	sharedView: View;
	onChangeSharedView: ( newView: View ) => void;
	isSharedViewModified: boolean;
	resetSharedView: () => void;
}

function getItemId( item: PageTemplateRecord ) {
	return item.id.toString();
}

function getAuthorLabel( authorRecord: any ) {
	if ( typeof authorRecord === 'string' ) {
		return authorRecord;
	}

	return authorRecord?.name || __( 'Unknown' );
}

export function PostTypeTemplatesTab( {
	postType,
	sharedView,
	onChangeSharedView,
	isSharedViewModified,
	resetSharedView,
}: PostTypeTemplatesTabProps ) {
	const invalidate = useInvalidate();
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/types/$type/list/$slug' } );
	const { records, isResolving, hasResolved } =
		useEntityRecordsWithPermissions( 'postType', 'wp_template', {
			per_page: -1,
			post_type: postType,
		} );
	const isTemplateActivateEnabled =
		typeof window !== 'undefined' &&
		(
			window as typeof window & {
				__experimentalTemplateActivate?: boolean;
			}
		 ).__experimentalTemplateActivate;
	const { activeTemplatesOption, activeTheme, defaultTemplateTypes } =
		useSelect( ( select ) => {
			const { getEntityRecord, getCurrentTheme } = select( coreStore );
			const currentTheme = getCurrentTheme();
			return {
				activeTemplatesOption: getEntityRecord( 'root', 'site' )
					?.active_templates,
				activeTheme: currentTheme,
				defaultTemplateTypes:
					currentTheme?.default_template_types || [],
			};
		}, [] );
	const templates = useMemo( () => {
		function isCustom( record: PageTemplateRecord ) {
			return (
				record.is_custom ??
				( ! record.meta?.is_wp_suggestion &&
					! defaultTemplateTypes.some(
						( type: any ) => type.slug === record.slug
					) )
			);
		}

		return ( ( records || [] ) as PageTemplateRecord[] ).map(
			( record ) => {
				const activeTemplateId = activeTemplatesOption?.[ record.slug ];
				const isThemeTemplate =
					typeof record.id === 'string' &&
					record.theme === activeTheme?.stylesheet;

				return {
					...record,
					_isActive: activeTemplateId
						? activeTemplateId === record.id
						: isThemeTemplate,
					_isCustom: isCustom( record ),
				};
			}
		);
	}, [ activeTemplatesOption, activeTheme, defaultTemplateTypes, records ] );
	const authors = useSelect(
		( select ) => {
			const { getUser } = select( coreStore );
			return templates.reduce( ( accumulator: any, template: any ) => {
				if ( template.author_text ) {
					accumulator[ template.author_text ] = template.author_text;
				} else if ( template.author ) {
					accumulator[ template.author ] = getUser( template.author );
				}
				return accumulator;
			}, {} );
		},
		[ templates ]
	);

	const handleQueryParamsChange = useCallback(
		( params: { page?: number; search?: string } ) => {
			navigate( {
				search: {
					...searchParams,
					...params,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	const {
		view: templateView,
		isModified,
		updateView,
		resetToDefault,
	} = useView( {
		kind: 'postType',
		name: 'wp_template',
		slug: getTemplateViewSlug( postType ),
		defaultView: DEFAULT_TEMPLATE_VIEW,
		activeViewOverrides: {},
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );
	const view = useMemo(
		() => ( {
			...templateView,
			type: sharedView.type,
			layout: sharedView.layout,
			titleField: DEFAULT_TEMPLATE_VIEW.titleField,
			mediaField: DEFAULT_TEMPLATE_VIEW.mediaField,
			descriptionField: DEFAULT_TEMPLATE_VIEW.descriptionField,
			fields: isTemplateActivateEnabled
				? DEFAULT_TEMPLATE_VIEW.fields
				: [ 'author' ],
		} ),
		[
			isTemplateActivateEnabled,
			sharedView.layout,
			sharedView.type,
			templateView,
		]
	);

	const onReset = () => {
		resetToDefault();
		resetSharedView();
		invalidate();
	};
	const onChangeView = ( newView: View ) => {
		updateView( {
			...newView,
			type: templateView.type,
			layout: templateView.layout,
		} );
		onChangeSharedView( newView );
	};

	const fields = useMemo< Field< PageTemplateRecord >[] >( () => {
		const authorElements = Object.entries( authors ).map(
			( [ value, authorRecord ] ) => ( {
				value,
				label: getAuthorLabel( authorRecord ),
			} )
		);

		const routeFields = [
			{
				...previewField,
				render( props: { item: PageTemplateRecord } ) {
					return (
						<TemplateItemPreview>
							<PreviewRender item={ props.item } />
						</TemplateItemPreview>
					);
				},
			},
			{
				...templateTitleField,
				render( props: { item: PageTemplateRecord } ) {
					return (
						<TemplateItemTitle>
							<TemplateTitleRender item={ props.item } />
						</TemplateItemTitle>
					);
				},
			},
			descriptionField,
			...( isTemplateActivateEnabled ? [ activeField, slugField ] : [] ),
			{
				...authorField,
				elements: authorElements,
			},
		];

		return routeFields as Field< PageTemplateRecord >[];
	}, [ authors, isTemplateActivateEnabled ] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( templates, view, fields ),
		[ fields, templates, view ]
	);

	const selection = [ ...( searchParams.postIds ?? [] ) ];
	if ( view.type === 'list' && selection.length === 0 && data.length > 0 ) {
		selection.push( getItemId( data[ 0 ] ) );
	}

	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			actions={ [] }
			isLoading={ isResolving || ! hasResolved }
			paginationInfo={ paginationInfo }
			defaultLayouts={ DEFAULT_TEMPLATE_LAYOUTS }
			getItemId={ getItemId }
			selection={ selection }
			onReset={ isModified || isSharedViewModified ? onReset : false }
			onChangeSelection={ ( items: string[] ) => {
				navigate( {
					search: {
						...searchParams,
						postIds: items.length > 0 ? items : undefined,
						edit:
							items.length === 0 ? undefined : searchParams.edit,
					},
				} );
			} }
			isItemClickable={ () => true }
			renderItemLink={ ( {
				item,
				...props
			}: {
				item: PageTemplateRecord;
			} ) => (
				<Link
					to={ `/types/wp_template/edit/${ encodeURIComponent(
						item.id
					) }` }
					{ ...props }
					onClick={ ( event ) => {
						event.stopPropagation();
					} }
				/>
			) }
		>
			<PostListDataViewsLayout />
		</DataViews>
	);
}
