import { Page } from '@wordpress/admin-ui';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { useView, useViewConfig } from '@wordpress/views';
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useInstalledThemePatterns from '../sidebar-navigation-screen-patterns/use-installed-theme-patterns';
import usePatternSettings from './use-pattern-settings';
import { previewField } from './fields';
import { searchItems } from './search-items';
import copyThemeFiles from './copy-theme-files';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

const EMPTY_ARRAY = [];
const VIEW_CONFIG_FIELDS = [ 'default_view', 'default_layouts' ];
const PARSE_OPTIONS = { __unstableSkipMigrationLogs: true };

/**
 * Duplicate modal that copies the files the pattern loads from the theme into
 * the Media Library before saving it, so the copy doesn't depend on the theme.
 *
 * @param {Object}     props
 * @param {Array}      props.items      Patterns to duplicate.
 * @param {() => void} props.closeModal Closes the modal.
 * @param {string[]}   props.themeUris  Folders the theme's files live in.
 */
function DuplicateModal( { items, closeModal, themeUris } ) {
	const [ item ] = items;
	const { createWarningNotice } = useDispatch( noticesStore );
	const duplicatedProps = useDuplicatePatternProps( {
		pattern: item,
		onSuccess: () => closeModal?.(),
	} );
	return (
		<CreatePatternModalContents
			onClose={ closeModal }
			confirmLabel={ _x( 'Duplicate', 'action label' ) }
			{ ...duplicatedProps }
			content={ async () => {
				const { content, failedUrls } = await copyThemeFiles(
					item.content,
					themeUris
				);
				if ( failedUrls.length ) {
					createWarningNotice(
						__(
							'Some files couldn’t be copied to the Media Library, so they still load from the theme.'
						),
						{ type: 'snackbar' }
					);
				}
				return content;
			} }
		/>
	);
}

export default function InstalledThemePatterns( { stylesheet } ) {
	const { path, query } = useLocation();
	const history = useHistory();
	const { default_view: defaultView, default_layouts: defaultLayouts } =
		useViewConfig( {
			kind: 'postType',
			name: PATTERN_TYPES.user,
			fields: VIEW_CONFIG_FIELDS,
		} );
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: PATTERN_TYPES.user,
		slug: 'installed-theme',
		defaultView,
		defaultLayouts,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( params ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: params.page,
					search: params.search,
				} )
			);
		},
	} );

	const { themes, isResolving } = useInstalledThemePatterns();
	const theme = themes.find( ( item ) => item.stylesheet === stylesheet );

	const patterns = useMemo(
		() =>
			theme?.patterns.map( ( pattern ) => ( {
				...pattern,
				keywords: pattern.keywords || [],
				type: PATTERN_TYPES.theme,
				blocks: parse( pattern.content, PARSE_OPTIONS ),
			} ) ) ?? EMPTY_ARRAY,
		[ theme ]
	);

	const postTypeFields = usePostFields( { postType: PATTERN_TYPES.user } );
	const fields = useMemo(
		() => [ previewField, ...( postTypeFields || [] ) ],
		[ postTypeFields ]
	);

	const { data, paginationInfo } = useMemo( () => {
		const viewWithoutFilters = { ...view, filters: [] };
		delete viewWithoutFilters.search;
		return filterSortAndPaginate(
			searchItems( patterns, view.search, { hasCategory: () => true } ),
			viewWithoutFilters,
			fields
		);
	}, [ patterns, view, fields ] );

	const patternActions = usePostActions( {
		postType: PATTERN_TYPES.user,
		context: 'list',
	} );
	const themeUris = theme?.uris;
	const actions = useMemo( () => {
		const duplicateAction = patternActions.find(
			( action ) => action.id === 'duplicate-pattern'
		);
		if ( ! duplicateAction || ! themeUris ) {
			return EMPTY_ARRAY;
		}
		return [
			{
				...duplicateAction,
				RenderModal: ( props ) => (
					<DuplicateModal { ...props } themeUris={ themeUris } />
				),
			},
		];
	}, [ patternActions, themeUris ] );
	const settings = usePatternSettings();

	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page
				className="edit-site-page-patterns-dataviews"
				title={ theme?.name }
				headingLevel={ 2 }
			>
				<DataViews
					key={ stylesheet }
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ data }
					getItemId={ ( item ) => item.name }
					isLoading={ isResolving && ! theme }
					isItemClickable={ () => false }
					view={ view }
					onChangeView={ updateView }
					defaultLayouts={ defaultLayouts }
					onReset={ isModified ? resetToDefault : false }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
