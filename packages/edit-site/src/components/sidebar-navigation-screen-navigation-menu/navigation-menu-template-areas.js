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
import { parse } from '@wordpress/blocks';

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

/**
 * Recursively injects a navigation menu ref into unbound core/navigation
 * blocks so that BlockPreview can load and reflect unsaved navigation edits.
 *
 * @param {Array}  blocks - The block tree to search.
 * @param {number} menuId - The navigation menu ID to inject.
 * @return {Array} The modified block tree with the navigation menu ref injected.
 */
function injectNavigationRef( blocks, menuId ) {
	return blocks.map( ( block ) => {
		if ( block.name === 'core/navigation' && ! block.attributes?.ref ) {
			return {
				...block,
				attributes: { ...block.attributes, ref: menuId },
			};
		}
		if ( block.innerBlocks?.length ) {
			return {
				...block,
				innerBlocks: injectNavigationRef( block.innerBlocks, menuId ),
			};
		}
		return block;
	} );
}

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

	// Augment each template part with pre-parsed blocks that have
	// the navigation ref injected. This ensures BlockPreview loads
	// the navigation content and reflects unsaved edits in real time
	// (the navigation block uses getEditedEntityRecord internally).
	const augmentedParts = useMemo( () => {
		return matchingParts.map( ( part ) => {
			if ( ! part?.content?.raw ) {
				return part;
			}
			const parsedBlocks = parse( part.content.raw, {
				__unstableSkipMigrationLogs: true,
			} );
			return {
				...part,
				blocks: injectNavigationRef( parsedBlocks, navigationMenuId ),
			};
		} );
	}, [ matchingParts, navigationMenuId ] );

	const settings = usePatternSettings();
	const fields = useMemo( () => [ previewField, patternTitleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( augmentedParts, view, fields ),
		[ augmentedParts, view, fields ]
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
