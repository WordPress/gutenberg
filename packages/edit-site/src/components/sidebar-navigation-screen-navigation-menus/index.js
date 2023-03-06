/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useHistory } from '../routes';
import NavigationMenuContent from './navigation-menu-content';
import SidebarButton from '../sidebar-button';
import { NavigationMenuLoader } from './loader';

const noop = () => {};
const NAVIGATION_MENUS_QUERY = { per_page: -1, status: 'publish' };

function SidebarNavigationScreenWrapper( { children, actions } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Navigation' ) }
			actions={ actions }
			description={ __(
				'Browse your site, edit pages, and manage your primary navigation menu.'
			) }
			content={ children }
		/>
	);
}

const prioritizedInserterBlocks = [
	'core/navigation-link/page',
	'core/navigation-link',
];

export default function SidebarNavigationScreenNavigationMenus() {
	const history = useHistory();
	const { navigationMenus, hasResolvedNavigationMenus } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			const navigationMenusQuery = [
				'postType',
				'wp_navigation',
				NAVIGATION_MENUS_QUERY,
			];
			return {
				navigationMenus: getEntityRecords( ...navigationMenusQuery ),
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenusQuery
				),
			};
		},
		[]
	);

	// Sort navigation menus by date.
	const orderedNavigationMenus = useMemo(
		() =>
			navigationMenus?.sort( ( menuA, menuB ) => {
				const menuADate = new Date( menuA.date );
				const menuBDate = new Date( menuB.date );
				return menuADate.getTime() > menuBDate.getTime();
			} ),
		[ navigationMenus ]
	);
	const firstNavigationMenu = orderedNavigationMenus?.[ 0 ]?.id;
	const blocks = useMemo( () => {
		return [
			createBlock( 'core/navigation', { ref: firstNavigationMenu } ),
		];
	}, [ firstNavigationMenu ] );

	const isLoading = ! hasResolvedNavigationMenus;
	const hasNavigationMenus = !! navigationMenus?.length;

	const onSelect = useCallback(
		( selectedBlock ) => {
			const { attributes } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.push( {
					postType: attributes.type,
					postId: attributes.id,
				} );
			}
		},
		[ history ]
	);
	const orderInitialBlockItems = useCallback( ( items ) => {
		items.sort( ( { id: aName }, { id: bName } ) => {
			// Sort block items according to `prioritizedInserterBlocks`.
			let aIndex = prioritizedInserterBlocks.indexOf( aName );
			let bIndex = prioritizedInserterBlocks.indexOf( bName );
			// All other block items should come after that.
			if ( aIndex < 0 ) aIndex = prioritizedInserterBlocks.length;
			if ( bIndex < 0 ) bIndex = prioritizedInserterBlocks.length;
			return aIndex - bIndex;
		} );
		return items;
	}, [] );

	if ( hasResolvedNavigationMenus && ! hasNavigationMenus ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'There are no Navigation Menus.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! hasResolvedNavigationMenus || isLoading ) {
		return (
			<SidebarNavigationScreenWrapper>
				<NavigationMenuLoader />
			</SidebarNavigationScreenWrapper>
		);
	}
	const { PrivateInserter } = unlock( blockEditorPrivateApis );
	return (
		<BlockEditorProvider
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<SidebarNavigationScreenWrapper
				actions={
					<PrivateInserter
						rootClientId={ blocks[ 0 ].clientId }
						position="bottom right"
						isAppender
						selectBlockOnInsert={ false }
						shouldDirectInsert={ false }
						__experimentalIsQuick
						toggleProps={ {
							as: SidebarButton,
							label: __( 'Add menu item' ),
						} }
						orderInitialBlockItems={ orderInitialBlockItems }
					/>
				}
			>
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
					<NavigationMenuContent
						rootClientId={ blocks[ 0 ].clientId }
						onSelect={ onSelect }
					/>
				</div>
			</SidebarNavigationScreenWrapper>
		</BlockEditorProvider>
	);
}
