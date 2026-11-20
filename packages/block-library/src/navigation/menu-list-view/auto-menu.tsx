/**
 * Auto menu (#86934): a menu whose only item is a Page List.
 *
 * Shown in place of the list view, so people see what the menu does (shows
 * their pages and keeps up as they add pages) and which pages are in it,
 * without learning what a Page List is. "Customize" turns it into links.
 */

import { Button, Icon as WCIcon } from '@wordpress/components';
import { EmptyState, Stack, Text } from '@wordpress/ui';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowRight, page as pageIcon, plus, update } from '@wordpress/icons';
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

const PAGES_SCREEN_URL = 'site-editor.php?p=%2Fpage';

function PageTree( { pages }: { pages: AutoMenuPage[] } ) {
	return (
		<ul className="wp-block-navigation-auto-menu__pages">
			{ pages.map( ( page ) => (
				<li key={ page.id }>
					<span
						className="wp-block-navigation-auto-menu__page"
						// The pages can't be edited here.
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							cursor: 'not-allowed',
						} }
					>
						<WCIcon icon={ pageIcon } size={ 20 } />
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
 * An Auto menu, shown in place of the menu's list view: what it is, the
 * pages in it, and, where the "+" for adding an
 * item would be, a way to the Pages screen, as adding a page is how an
 * item is added. "Customize" turns it into links that can be edited.
 *
 * @param props                    Component props.
 * @param props.navigationClientId Client id of the Navigation block.
 * @param props.showDescription    Whether to say what an Auto menu is.
 * @param props.onAddPage          Opens the screen's own way to add a page.
 *                                 Without it, the Pages screen opens.
 */
export default function AutoMenu( {
	navigationClientId,
	showDescription = true,
	onAddPage,
}: {
	navigationClientId: string;
	onAddPage?: () => void;
	// Off where the screen around it already says what an Auto menu is.
	showDescription?: boolean;
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
			<Stack direction="column" gap="md">
				<EmptyState.Root style={ { padding: 0 } }>
					<EmptyState.Icon icon={ update } />
					<EmptyState.Title>{ __( 'Auto menu' ) }</EmptyState.Title>
					{ showDescription && (
						<EmptyState.Description>
							{ __(
								'Shows your pages, and updates when they change.'
							) }
						</EmptyState.Description>
					) }
					<EmptyState.Actions>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							accessibleWhenDisabled
							disabled={ ! canCustomize }
							onClick={ () => setIsConfirming( true ) }
							className="wp-block-navigation-auto-menu__customize"
						>
							{ __( 'Customize' ) }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
				<Stack direction="column" gap="xs">
					<Text
						variant="body-sm"
						render={ <h4 /> }
						className="wp-block-navigation-auto-menu__pages-heading"
						// Inline, as the route editor doesn't load block styles.
						style={ {
							margin: 0,
							textTransform: 'uppercase',
							fontWeight: 500,
							fontSize: 11,
							opacity: 0.7,
						} }
					>
						{ __( 'Pages in this menu' ) }
					</Text>
					{ ! hasResolved && (
						<Text variant="body-sm">
							{ __( 'Loading pages…' ) }
						</Text>
					) }
					{ tree.length > 0 && <PageTree pages={ tree } /> }
					<Button
						__next40pxDefaultSize
						variant="secondary"
						{ ...( onAddPage
							? { onClick: onAddPage }
							: {
									href: PAGES_SCREEN_URL,
									description: __(
										'Opens the Pages screen. New pages are added to this menu.'
									),
								} ) }
						icon={ plus }
						className="wp-block-navigation-auto-menu__add-page"
						// Inline, as the route editor doesn't load block styles.
						style={ {
							justifyContent: 'flex-start',
							borderStyle: 'dashed',
						} }
					>
						<span style={ { flex: 1, textAlign: 'start' } }>
							{ __( 'Add a page' ) }
						</span>
						{ ! onAddPage && (
							<WCIcon icon={ arrowRight } size={ 20 } />
						) }
					</Button>
				</Stack>
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
