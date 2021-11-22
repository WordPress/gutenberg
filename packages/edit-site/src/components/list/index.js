/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { InterfaceSkeleton } from '@wordpress/interface';
import { __, sprintf } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import useRegisterShortcuts from './use-register-shortcuts';
import Header from './header';
import NavigationSidebar from '../navigation-sidebar';
import Table from './table';

export default function List( { templateType } ) {
	useRegisterShortcuts();
	const isDesktopViewport = useViewportMatch( 'medium' );

	const { previousShortcut, nextShortcut } = useSelect( ( select ) => {
		return {
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/next-region' ),
		};
	}, [] );

	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	const itemsListLabel = postType?.labels?.items_list;

	return (
		<InterfaceSkeleton
			className="edit-site-list"
			labels={ {
				header: sprintf(
					// translators: %s - the name of the page, 'Header' as in the header area of that page.
					__( '%s - Header' ),
					itemsListLabel
				),
				drawer: __( 'Navigation Sidebar' ),
				body: sprintf(
					// translators: %s - the name of the page, 'Content' as in the content area of that page.
					__( '%s - Content' ),
					itemsListLabel
				),
			} }
			header={ <Header templateType={ templateType } /> }
			drawer={
				<NavigationSidebar
					defaultIsOpen={ isDesktopViewport }
					activeTemplateType={ templateType }
				/>
			}
			content={
				<main className="edit-site-list-main">
					<Table templateType={ templateType } />
				</main>
			}
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
