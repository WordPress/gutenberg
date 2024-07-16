/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	privateApis as editorPrivateApis,
	EditorProvider,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { Async } from '../async';
import Page from '../page';
import { default as Link, useLink } from '../routes/link';
import AddNewTemplate from '../add-new-template';
import { useAddedBy } from './hooks';
import {
	TEMPLATE_POST_TYPE,
	OPERATOR_IS_ANY,
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
} from '../../utils/constants';

import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';
import { useEditPostAction } from '../dataviews-actions';

const { usePostActions } = unlock( editorPrivateApis );

const { useGlobalStyle } = unlock( blockEditorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];

const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		fields: [ 'template', 'author' ],
		layout: {
			primaryField: 'title',
			combinedFields: [
				{
					id: 'template',
					header: __( 'Template' ),
					children: [ 'title', 'description' ],
					direction: 'vertical',
				},
			],
			styles: {
				template: {
					maxWidth: 400,
					minWidth: 320,
				},
				preview: {
					minWidth: 120,
					maxWidth: 120,
				},
				author: {
					width: '1%',
				},
			},
		},
	},
	[ LAYOUT_GRID ]: {
		fields: [ 'title', 'description', 'author' ],
		layout: {
			mediaField: 'preview',
			primaryField: 'title',
			columnFields: [ 'description' ],
		},
	},
	[ LAYOUT_LIST ]: {
		fields: [ 'title', 'description', 'author' ],
		layout: {
			primaryField: 'title',
			mediaField: 'preview',
		},
	},
};

const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	fields: defaultLayouts[ LAYOUT_GRID ].fields,
	layout: defaultLayouts[ LAYOUT_GRID ].layout,
	filters: [],
};

function Title( { item, viewType } ) {
	if ( viewType === LAYOUT_LIST ) {
		return decodeEntities( item.title?.rendered ) || __( '(no title)' );
	}
	const linkProps = {
		params: {
			postId: item.id,
			postType: item.type,
			canvas: 'edit',
		},
	};
	return (
		<Link { ...linkProps }>
			{ decodeEntities( item.title?.rendered ) || __( '(no title)' ) }
		</Link>
	);
}

function AuthorField( { item } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<HStack alignment="left" spacing={ 0 }>
			{ imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

function Preview( { item, viewType } ) {
	const settings = usePatternSettings();
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const blocks = useMemo( () => {
		return parse( item.content.raw );
	}, [ item.content.raw ] );
	const { onClick } = useLink( {
		postId: item.id,
		postType: item.type,
		canvas: 'edit',
	} );

	const isEmpty = ! blocks?.length;
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider post={ item } settings={ settings }>
			<div
				className={ `page-templates-preview-field is-viewtype-${ viewType }` }
				style={ { backgroundColor } }
			>
				{ viewType === LAYOUT_LIST && ! isEmpty && (
					<Async>
						<BlockPreview blocks={ blocks } />
					</Async>
				) }
				{ viewType !== LAYOUT_LIST && (
					<button
						className="page-templates-preview-field__button"
						type="button"
						onClick={ onClick }
						aria-label={ item.title?.rendered || item.title }
					>
						{ isEmpty && __( 'Empty template' ) }
						{ ! isEmpty && (
							<Async>
								<BlockPreview blocks={ blocks } />
							</Async>
						) }
					</button>
				) }
			</div>
		</EditorProvider>
	);
}

export default function PageTemplates() {
	const { params } = useLocation();
	const { activeView = 'all', layout, postId } = params;
	const [ selection, setSelection ] = useState( [ postId ] );

	const defaultView = useMemo( () => {
		const usedType = layout ?? DEFAULT_VIEW.type;
		return {
			...DEFAULT_VIEW,
			type: usedType,
			layout: defaultLayouts[ usedType ].layout,
			fields: defaultLayouts[ usedType ].fields,
			filters:
				activeView !== 'all'
					? [
							{
								field: 'author',
								operator: 'isAny',
								value: [ activeView ],
							},
					  ]
					: [],
		};
	}, [ layout, activeView ] );
	const [ view, setView ] = useState( defaultView );
	useEffect( () => {
		setView( ( currentView ) => ( {
			...currentView,
			filters:
				activeView !== 'all'
					? [
							{
								field: 'author',
								operator: OPERATOR_IS_ANY,
								value: [ activeView ],
							},
					  ]
					: [],
		} ) );
	}, [ activeView ] );

	const { records, isResolving: isLoadingData } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{
			per_page: -1,
		}
	);
	const history = useHistory();
	const onSelectionChange = useCallback(
		( items ) => {
			if ( view?.type === LAYOUT_LIST ) {
				history.push( {
					...params,
					postId: items.length === 1 ? items[ 0 ].id : undefined,
				} );
			}
		},
		[ history, params, view?.type ]
	);

	const authors = useMemo( () => {
		if ( ! records ) {
			return EMPTY_ARRAY;
		}
		const authorsSet = new Set();
		records.forEach( ( template ) => {
			authorsSet.add( template.author_text );
		} );
		return Array.from( authorsSet ).map( ( author ) => ( {
			value: author,
			label: author,
		} ) );
	}, [ records ] );

	const fields = useMemo(
		() => [
			{
				header: __( 'Preview' ),
				id: 'preview',
				render: ( { item } ) => {
					return <Preview item={ item } viewType={ view.type } />;
				},
				enableSorting: false,
			},
			{
				header: __( 'Template' ),
				id: 'title',
				getValue: ( { item } ) => item.title?.rendered,
				render: ( { item } ) => (
					<Title item={ item } viewType={ view.type } />
				),
				enableHiding: false,
				enableGlobalSearch: true,
			},
			{
				header: __( 'Description' ),
				id: 'description',
				render: ( { item } ) => {
					return (
						item.description && (
							<span className="page-templates-description">
								{ decodeEntities( item.description ) }
							</span>
						)
					);
				},
				enableSorting: false,
				enableGlobalSearch: true,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				getValue: ( { item } ) => item.author_text,
				render: ( { item } ) => {
					return <AuthorField viewType={ view.type } item={ item } />;
				},
				elements: authors,
			},
		],
		[ authors, view.type ]
	);

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( records, view, fields );
	}, [ records, view, fields ] );

	const postTypeActions = usePostActions( {
		postType: TEMPLATE_POST_TYPE,
		context: 'list',
	} );
	const editAction = useEditPostAction();
	const actions = useMemo(
		() => [ editAction, ...postTypeActions ],
		[ postTypeActions, editAction ]
	);

	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.type !== view.type ) {
				history.push( {
					...params,
					layout: newView.type,
				} );
			}

			setView( newView );
		},
		[ view.type, setView, history, params ]
	);

	return (
		<Page
			className="edit-site-page-templates"
			title={ __( 'Templates' ) }
			actions={ <AddNewTemplate /> }
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
				onSelectionChange={ onSelectionChange }
				selection={ selection }
				setSelection={ setSelection }
				defaultLayouts={ defaultLayouts }
			/>
		</Page>
	);
}
