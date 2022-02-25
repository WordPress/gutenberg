/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { SlotFillProvider, Popover } from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import { InterfaceSkeleton } from '@wordpress/interface';
import { EditorSnackbars, UnsavedChangesWarning } from '@wordpress/editor';
import {
	ShortcutProvider,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import NavigationSidebar from '../navigation-sidebar';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import { store as editSiteStore } from '../../store';

function Layout( {
	children,
	isNavigationDefaultOpen,
	activeTemplateType,
	...props
} ) {
	const { isNavigationOpen, previousShortcut, nextShortcut } = useSelect(
		( select ) => {
			const { isNavigationOpened } = select( editSiteStore );
			const { getAllShortcutKeyCombinations } = select(
				keyboardShortcutsStore
			);

			// The currently selected entity to display. Typically template or template part.
			return {
				isNavigationOpen: isNavigationOpened(),
				previousShortcut: getAllShortcutKeyCombinations(
					'core/edit-site/previous-region'
				),
				nextShortcut: getAllShortcutKeyCombinations(
					'core/edit-site/next-region'
				),
			};
		},
		[]
	);
	const { createErrorNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( isNavigationOpen ) {
			document.body.classList.add( 'is-navigation-sidebar-open' );
		} else {
			document.body.classList.remove( 'is-navigation-sidebar-open' );
		}
	}, [ isNavigationOpen ] );

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	return (
		<ShortcutProvider>
			<SlotFillProvider>
				<EntityProvider kind="root" type="site">
					<GlobalStylesProvider>
						<UnsavedChangesWarning />
						<InterfaceSkeleton
							drawer={
								<NavigationSidebar
									isDefaultOpen={ isNavigationDefaultOpen }
									activeTemplateType={ activeTemplateType }
								/>
							}
							notices={ <EditorSnackbars /> }
							shortcuts={ {
								previous: previousShortcut,
								next: nextShortcut,
							} }
							{ ...props }
						/>
						<Popover.Slot />
						<PluginArea onError={ onPluginAreaError } />
						{ children }
					</GlobalStylesProvider>
				</EntityProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}

export default Layout;
