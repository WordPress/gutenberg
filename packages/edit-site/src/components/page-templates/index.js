/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalView as View,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	DataViews,
	sortByTextFields,
	getPaginationResults,
} from '@wordpress/dataviews';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import AddNewTemplate from '../add-new-template';
import { useAddedBy, AvatarImage } from '../list/added-by';
import {
	TEMPLATE_POST_TYPE,
	ENUMERATION_TYPE,
	OPERATOR_IN,
	OPERATOR_NOT_IN,
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
} from '../../utils/constants';
import {
	useResetTemplateAction,
	deleteTemplateAction,
	renameTemplateAction,
} from './template-actions';
import { postRevisionsAction } from '../actions';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';
import PostPreview from '../post-preview';

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);
const { useHistory } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];

const defaultConfigPerViewType = {
	[ LAYOUT_TABLE ]: {},
	[ LAYOUT_GRID ]: {
		mediaField: 'preview',
		primaryField: 'title',
	},
	[ LAYOUT_LIST ]: {
		primaryField: 'title',
		mediaField: 'preview',
	},
};

const DEFAULT_VIEW = {
	type: LAYOUT_TABLE,
	search: '',
	page: 1,
	perPage: 20,
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [ 'preview' ],
	layout: {},
	filters: [],
};

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

function TemplateTitle( { item, viewType } ) {
	if ( viewType === LAYOUT_LIST ) {
		return (
			<>
				{ decodeEntities( item.title?.rendered ) || __( '(no title)' ) }
			</>
		);
	}

	return (
		<VStack spacing={ 1 }>
			<View as="span" className="dataviews-view-grid__title-field">
				<Link
					params={ {
						postId: item.id,
						postType: item.type,
						canvas: 'edit',
					} }
				>
					{ decodeEntities( item.title?.rendered ) ||
						__( '(no title)' ) }
				</Link>
			</View>
		</VStack>
	);
}

function AuthorField( { item, viewType } ) {
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );
	const withIcon = viewType !== LAYOUT_LIST;

	return (
		<HStack alignment="left" spacing={ 1 }>
			{ withIcon && imageUrl && <AvatarImage imageUrl={ imageUrl } /> }
			{ withIcon && ! imageUrl && (
				<div className="edit-site-list-added-by__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ text }</span>
		</HStack>
	);
}

function TemplatePreview( { content, viewType } ) {
	const settings = usePatternSettings();
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const blocks = useMemo( () => {
		return parse( content );
	}, [ content ] );
	if ( ! blocks?.length ) {
		return null;
	}
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<div
				className={ `page-templates-preview-field is-viewtype-${ viewType }` }
				style={ { backgroundColor } }
			>
				<BlockPreview blocks={ blocks } />
			</div>
		</ExperimentalBlockEditorProvider>
	);
}

export default function DataviewsTemplates() {
	const [ templateId, setTemplateId ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { records: allTemplates, isResolving: isLoadingData } =
		useEntityRecords( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
	const history = useHistory();

	const onSelectionChange = useCallback(
		( items ) =>
			setTemplateId( items?.length === 1 ? items[ 0 ].id : null ),
		[ setTemplateId ]
	);

	const authors = useMemo( () => {
		if ( ! allTemplates ) {
			return EMPTY_ARRAY;
		}
		const authorsSet = new Set();
		allTemplates.forEach( ( template ) => {
			authorsSet.add( template.author_text );
		} );
		return Array.from( authorsSet ).map( ( author ) => ( {
			value: author,
			label: author,
		} ) );
	}, [ allTemplates ] );

	const fields = useMemo(
		() => [
			{
				header: __( 'Preview' ),
				id: 'preview',
				render: ( { item } ) => {
					return (
						<TemplatePreview
							content={ item.content.raw }
							viewType={ view.type }
						/>
					);
				},
				minWidth: 120,
				maxWidth: 120,
				enableSorting: false,
			},
			{
				header: __( 'Template' ),
				id: 'title',
				getValue: ( { item } ) => item.title?.rendered,
				render: ( { item } ) => (
					<TemplateTitle item={ item } viewType={ view.type } />
				),
				maxWidth: 400,
				enableHiding: false,
			},
			{
				header: __( 'Description' ),
				id: 'description',
				getValue: ( { item } ) => item.description,
				render: ( { item } ) => {
					return item.description ? (
						decodeEntities( item.description )
					) : (
						<>
							<Text variant="muted" aria-hidden="true">
								&#8212;
							</Text>
							<VisuallyHidden>
								{ __( 'No description.' ) }
							</VisuallyHidden>
						</>
					);
				},
				maxWidth: 200,
				enableSorting: false,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				getValue: ( { item } ) => item.author_text,
				render: ( { item } ) => {
					return <AuthorField viewType={ view.type } item={ item } />;
				},
				enableHiding: false,
				type: ENUMERATION_TYPE,
				elements: authors,
			},
		],
		[ authors, view.type ]
	);

	const { data, paginationInfo } = useMemo( () => {
		if ( ! allTemplates ) {
			return {
				data: EMPTY_ARRAY,
				paginationInfo: { totalItems: 0, totalPages: 0 },
			};
		}
		let filteredTemplates = [ ...allTemplates ];
		// Handle global search.
		if ( view.search ) {
			const normalizedSearch = normalizeSearchInput( view.search );
			filteredTemplates = filteredTemplates.filter( ( item ) => {
				const title = item.title?.rendered || item.slug;
				return (
					normalizeSearchInput( title ).includes(
						normalizedSearch
					) ||
					normalizeSearchInput( item.description ).includes(
						normalizedSearch
					)
				);
			} );
		}

		// Handle filters.
		if ( view.filters.length > 0 ) {
			view.filters.forEach( ( filter ) => {
				if (
					filter.field === 'author' &&
					filter.operator === OPERATOR_IN &&
					!! filter.value
				) {
					filteredTemplates = filteredTemplates.filter( ( item ) => {
						return item.author_text === filter.value;
					} );
				} else if (
					filter.field === 'author' &&
					filter.operator === OPERATOR_NOT_IN &&
					!! filter.value
				) {
					filteredTemplates = filteredTemplates.filter( ( item ) => {
						return item.author_text !== filter.value;
					} );
				}
			} );
		}

		// Handle sorting.
		if ( view.sort ) {
			filteredTemplates = sortByTextFields( {
				data: filteredTemplates,
				view,
				fields,
				textFields: [ 'title' ],
			} );
		}
		// Handle pagination.
		return getPaginationResults( {
			data: filteredTemplates,
			view,
		} );
	}, [ allTemplates, view, fields ] );

	const resetTemplateAction = useResetTemplateAction();
	const actions = useMemo(
		() => [
			resetTemplateAction,
			deleteTemplateAction,
			renameTemplateAction,
			postRevisionsAction,
		],
		[ resetTemplateAction ]
	);

	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.type !== view.type ) {
				newView = {
					...newView,
					layout: {
						...defaultConfigPerViewType[ newView.type ],
					},
				};
			}

			setView( newView );
		},
		[ view.type, setView ]
	);

	return (
		<>
			<Page
				className={
					view.type === LAYOUT_LIST
						? 'edit-site-template-pages-list-view'
						: null
				}
				title={ __( 'Templates' ) }
				actions={
					<AddNewTemplate
						templateType={ TEMPLATE_POST_TYPE }
						showIcon={ false }
						toggleProps={ { variant: 'primary' } }
					/>
				}
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
					deferredRendering={
						! view.hiddenFields?.includes( 'preview' )
					}
				/>
			</Page>
			{ view.type === LAYOUT_LIST && (
				<Page>
					<div
						className="edit-site-template-pages-preview"
						tabIndex={ 0 }
						role="button"
						onKeyDown={ ( event ) => {
							const { keyCode } = event;
							if ( keyCode === ENTER || keyCode === SPACE ) {
								history.push( {
									postId: templateId,
									postType: TEMPLATE_POST_TYPE,
									canvas: 'edit',
								} );
							}
						} }
						onClick={ () =>
							history.push( {
								postId: templateId,
								postType: TEMPLATE_POST_TYPE,
								canvas: 'edit',
							} )
						}
					>
						{ templateId !== null ? (
							<PostPreview
								postId={ templateId }
								postType={ TEMPLATE_POST_TYPE }
							/>
						) : (
							<div
								style={ {
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									textAlign: 'center',
									height: '100%',
								} }
							>
								<p>{ __( 'Select a template to preview' ) }</p>
							</div>
						) }
					</div>
				</Page>
			) }
		</>
	);
}
