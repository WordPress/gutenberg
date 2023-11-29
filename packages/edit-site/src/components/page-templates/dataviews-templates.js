/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	VisuallyHidden,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import { useAddedBy, AvatarImage } from '../list/added-by';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { DataViews } from '../dataviews';
import { ENUMERATION_TYPE, OPERATOR_IN } from '../dataviews/constants';
import {
	useResetTemplateAction,
	deleteTemplateAction,
	renameTemplateAction,
} from './template-actions';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);

const EMPTY_ARRAY = [];

const defaultConfigPerViewType = {
	list: {},
	grid: {
		mediaField: 'preview',
		primaryField: 'title',
	},
};

const DEFAULT_VIEW = {
	type: 'list',
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

// TODO: these are going to be reused in the template part list.
// That's the reason for leaving the template parts code for now.
function TemplateTitle( { item } ) {
	const { isCustomized } = useAddedBy( item.type, item.id );
	return (
		<VStack spacing={ 1 }>
			<Heading as="h3" level={ 5 }>
				<Link
					params={ {
						postId: item.id,
						postType: item.type,
						canvas: 'edit',
					} }
				>
					{ decodeEntities( item.title?.rendered || item.slug ) ||
						__( '(no title)' ) }
				</Link>
			</Heading>
			{ isCustomized && (
				<span className="edit-site-list-added-by__customized-info">
					{ item.type === TEMPLATE_POST_TYPE
						? _x( 'Customized', 'template' )
						: _x( 'Customized', 'template part' ) }
				</span>
			) }
		</VStack>
	);
}

function AuthorField( { item } ) {
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );
	return (
		<HStack alignment="left" spacing={ 1 }>
			{ imageUrl ? (
				<AvatarImage imageUrl={ imageUrl } />
			) : (
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
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { records: allTemplates, isResolving: isLoadingData } =
		useEntityRecords( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );

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
				render: ( { item, view: { type: viewType } } ) => {
					return (
						<TemplatePreview
							content={ item.content.raw }
							viewType={ viewType }
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
				getValue: ( { item } ) => item.title?.rendered || item.slug,
				render: ( { item } ) => <TemplateTitle item={ item } />,
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
					return <AuthorField item={ item } />;
				},
				enableHiding: false,
				type: ENUMERATION_TYPE,
				elements: authors,
			},
		],
		[ authors ]
	);

	const { shownTemplates, paginationInfo } = useMemo( () => {
		if ( ! allTemplates ) {
			return {
				shownTemplates: EMPTY_ARRAY,
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
				}
			} );
		}

		// Handle sorting.
		if ( view.sort ) {
			const stringSortingFields = [ 'title', 'author' ];
			const fieldId = view.sort.field;
			if ( stringSortingFields.includes( fieldId ) ) {
				const fieldToSort = fields.find( ( field ) => {
					return field.id === fieldId;
				} );
				filteredTemplates.sort( ( a, b ) => {
					const valueA = fieldToSort.getValue( { item: a } ) ?? '';
					const valueB = fieldToSort.getValue( { item: b } ) ?? '';
					return view.sort.direction === 'asc'
						? valueA.localeCompare( valueB )
						: valueB.localeCompare( valueA );
				} );
			}
		}

		// Handle pagination.
		const start = ( view.page - 1 ) * view.perPage;
		const totalItems = filteredTemplates?.length || 0;
		filteredTemplates = filteredTemplates?.slice(
			start,
			start + view.perPage
		);
		return {
			shownTemplates: filteredTemplates,
			paginationInfo: {
				totalItems,
				totalPages: Math.ceil( totalItems / view.perPage ),
			},
		};
	}, [ allTemplates, view, fields ] );

	const resetTemplateAction = useResetTemplateAction();
	const actions = useMemo(
		() => [
			resetTemplateAction,
			deleteTemplateAction,
			renameTemplateAction,
		],
		[ resetTemplateAction ]
	);
	const onChangeView = useCallback(
		( viewUpdater ) => {
			let updatedView =
				typeof viewUpdater === 'function'
					? viewUpdater( view )
					: viewUpdater;
			if ( updatedView.type !== view.type ) {
				updatedView = {
					...updatedView,
					layout: {
						...defaultConfigPerViewType[ updatedView.type ],
					},
				};
			}

			setView( updatedView );
		},
		[ view, setView ]
	);
	return (
		<Page title={ __( 'Templates' ) }>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ shownTemplates }
				getItemId={ ( item ) => item.id }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
				supportedLayouts={ [ 'list', 'grid' ] }
			/>
		</Page>
	);
}
