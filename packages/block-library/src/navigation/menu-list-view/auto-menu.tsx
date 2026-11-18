/**
 * Auto menu (#86934): a menu whose only item is a Page List.
 *
 * Shown in place of the list view, so people see what the menu does (shows
 * their pages and keeps up as they add pages) and which pages are in it,
 * without learning what a Page List is. "Customize" turns it into links.
 */

import { Button, Icon as WCIcon } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { update } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';
import isNavigationMenuEditingEnabled from './is-enabled';
import { useAutoMenuPageList, useAutoMenuPages } from './auto-menu-use-pages';
import type { AutoMenuPage } from './auto-menu-use-pages';
import {
	useCustomizeAutoMenu,
	AutoMenuCustomizeDialog,
} from './auto-menu-customize';

/**
 * Whether the Navigation block's only item is a Page List.
 *
 * @param navigationClientId Client id of the Navigation block.
 * @return Whether the menu is an Auto menu.
 */
export function useIsAutoMenu(
	navigationClientId: string | null | undefined
): boolean {
	const pageList = useAutoMenuPageList(
		isNavigationMenuEditingEnabled() ? navigationClientId : null
	);
	return !! pageList;
}

/**
 * A short explanation of what an Auto menu is. Shared with the block toolbar.
 */
export function AutoMenuDescription() {
	return (
		<Text variant="body-sm" render={ <p /> }>
			{ __(
				'Your menu shows your published pages, and updates itself when you add a page.'
			) }
		</Text>
	);
}

function PageTree( { pages }: { pages: AutoMenuPage[] } ) {
	return (
		<ul className="wp-block-navigation-auto-menu__pages">
			{ pages.map( ( page ) => (
				<li key={ page.id }>
					<span className="wp-block-navigation-auto-menu__page">
						{ decodeEntities( page.title ) }
					</span>
					{ page.children.length > 0 && (
						<PageTree pages={ page.children } />
					) }
				</li>
			) ) }
		</ul>
	);
}

/**
 * @param props                    Component props.
 * @param props.navigationClientId Client id of the Navigation block.
 */
export default function AutoMenu( {
	navigationClientId,
}: {
	navigationClientId: string;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	const [ isConfirming, setIsConfirming ] = useState( false );
	const pageList = useAutoMenuPageList( navigationClientId );
	const { tree, hasResolved } = useAutoMenuPages(
		pageList?.attributes?.parentPageID
	);
	const { canCustomize, isBusy, customize } =
		useCustomizeAutoMenu( navigationClientId );

	const onConfirm = () => {
		// This component unmounts once the menu is customized, so move focus
		// to the first item of the list view that replaces it.
		const container = ref.current?.parentElement;
		setIsConfirming( false );
		customize();
		window.requestAnimationFrame( () => {
			container
				?.querySelector< HTMLElement >(
					'.block-editor-list-view-block-select-button'
				)
				?.focus();
		} );
	};

	return (
		<div ref={ ref } className="wp-block-navigation-auto-menu">
			<Stack direction="column" gap="sm">
				<Stack direction="row" gap="xs" align="center">
					<WCIcon icon={ update } size={ 20 } />
					<Text variant="heading-sm" render={ <h3 /> }>
						{ __( 'Auto menu' ) }
					</Text>
				</Stack>
				<AutoMenuDescription />
				<Button
					__next40pxDefaultSize
					variant="secondary"
					accessibleWhenDisabled
					disabled={ ! canCustomize }
					onClick={ () => setIsConfirming( true ) }
					// Inline, as the route editor doesn't load block styles.
					style={ { justifyContent: 'center' } }
					className="wp-block-navigation-auto-menu__customize"
				>
					{ __( 'Customize' ) }
				</Button>
				<Text
					variant="body-sm"
					render={ <h4 /> }
					className="wp-block-navigation-auto-menu__pages-heading"
				>
					{ __( 'Pages in this menu' ) }
				</Text>
				{ ! hasResolved && (
					<Text variant="body-sm">{ __( 'Loading pages…' ) }</Text>
				) }
				{ hasResolved && tree.length === 0 && (
					<Text variant="body-sm">
						{ __(
							'No published pages yet. Pages you publish will show up here.'
						) }
					</Text>
				) }
				{ tree.length > 0 && <PageTree pages={ tree } /> }
			</Stack>
			{ isConfirming && (
				<AutoMenuCustomizeDialog
					isBusy={ isBusy }
					onConfirm={ onConfirm }
					onCancel={ () => setIsConfirming( false ) }
				/>
			) }
		</div>
	);
}
