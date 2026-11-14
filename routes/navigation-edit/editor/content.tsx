import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );

// Needs to be kept in sync with the query used at packages/block-library/src/page-list/edit.jsx.
const MAX_PAGE_COUNT = 100;
const PAGES_QUERY = [
	'postType',
	'page',
	{
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
		// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
		// sort.
		orderby: 'menu_order',
		order: 'asc',
	},
];

export default function NavigationMenuContent( {
	rootClientId,
}: {
	rootClientId: string;
} ) {
	// Read from the global rather than imported: `@wordpress/block-library`
	// is not a script module and only loads with the lazily loaded editor
	// assets, so a static import here would compile to a read of a global
	// that does not exist yet when this bundle initializes, capturing
	// `undefined` (and crashing the screen). This component only renders once
	// `useEditorAssets` reports the assets ready, which is exactly when the
	// global is defined — do not "clean this up" into an import.
	const { NavigationLinkUI, NavigationMenuItems } = unlock(
		( window as any ).wp.blockLibrary.privateApis
	);

	const { isLoading, hasChildren } = useSelect(
		( select ) => {
			const { areInnerBlocksControlled, getBlockCount } =
				select( blockEditorStore );
			const { isResolving } = select( coreStore );

			const isLoadingPages = isResolving(
				'getEntityRecords',
				PAGES_QUERY
			);

			return {
				hasChildren: getBlockCount( rootClientId ) > 0,
				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading:
					! areInnerBlocksControlled( rootClientId ) ||
					isLoadingPages,
			};
		},
		[ rootClientId ]
	);
	const { openListViewContentPanel } = unlock(
		useDispatch( blockEditorStore )
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && ! hasChildren && (
				<p className="navigation-edit-editor__empty-message">
					{ __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			{ /*
			 * A Page List's pages are listed to switch on and off and reorder,
			 * in place of the Page List, which the list view leaves out.
			 */ }
			{ ! isLoading && (
				<NavigationMenuItems
					clientId={ rootClientId }
					listView={
						<PrivateListView
							rootClientId={ rootClientId }
							onSelect={ openListViewContentPanel }
							blockSettingsMenu={ LeafMoreMenu }
							showAppender
							additionalBlockContent={ NavigationLinkUI }
							showContentPopover
							isExpanded
						/>
					}
				/>
			) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
		</>
	);
}
