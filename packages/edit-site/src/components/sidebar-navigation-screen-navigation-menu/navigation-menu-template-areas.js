/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEntityRecord } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { previewField } from '../page-patterns/fields';
import { LAYOUT_GRID } from '../../utils/constants';
import useNavigationMenusUsedIn from './use-navigation-menus-used-in';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { patternTitleField } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	perPage: 20,
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	layout: {
		previewSize: 430,
	},
};
const DEFAULT_LAYOUTS = {
	[ LAYOUT_GRID ]: {},
};

export default function NavigationMenuTemplateAreas() {
	const {
		params: { postId },
	} = useLocation();
	const history = useHistory();
	const navigationMenuId = parseInt( postId );

	const [ view, setView ] = useState( DEFAULT_VIEW );

	const { record: navigationMenu } = useEntityRecord(
		'postType',
		'wp_navigation',
		postId
	);
	const menuTitle = decodeEntities( navigationMenu?.title?.rendered ?? '' );

	const menuIds = useMemo( () => [ navigationMenuId ], [ navigationMenuId ] );
	const { usageMap, isResolving } = useNavigationMenusUsedIn( menuIds );
	const matchingParts = usageMap.get( navigationMenuId ) ?? EMPTY_ARRAY;

	const settings = usePatternSettings();
	const fields = useMemo( () => [ previewField, patternTitleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( matchingParts, view, fields ),
		[ matchingParts, view, fields ]
	);

	const title = menuTitle
		? sprintf(
				/* translators: %s: navigation menu name */
				__( 'Template parts using %s' ),
				menuTitle
		  )
		: __( 'Template parts' );

	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page
				title={ title }
				subTitle={ __(
					'A list of all the template parts using this navigation menu'
				) }
			>
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					data={ data ?? EMPTY_ARRAY }
					isLoading={ isResolving }
					view={ view }
					onChangeView={ setView }
					defaultLayouts={ DEFAULT_LAYOUTS }
					onClickItem={ ( item ) => {
						history.navigate(
							`/${ item.type }/${ item.id }?canvas=edit`
						);
					} }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
