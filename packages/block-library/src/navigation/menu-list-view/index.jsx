import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import isNavigationMenuEditingEnabled from './is-enabled';
import NavigationMenuAppender from './appender';
import useSubmenuAppenderParentIds from './use-submenu-appender-parent-ids';
import AutoMenu, { useIsAutoMenu } from './auto-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );

function renderAppender( props ) {
	return <NavigationMenuAppender { ...props } />;
}

/**
 * The list view used to edit the items of a Navigation Menu.
 *
 * Shared by every surface that edits a menu's items, so they behave the same:
 * the Navigation screen in the Site Editor sidebar, the Navigation route in
 * the extensible site editor, and the List View tab in the Navigation block's
 * inspector controls.
 *
 * With the "Navigation menu editing prototypes" experiment off, this is a
 * plain `PrivateListView`.
 *
 * @param {Object} props                    Component props.
 * @param {string} props.rootClientId       Client id of the Navigation block.
 * @param {string} props.navigationClientId Client id of the Navigation block, when `rootClientId` points elsewhere (for example a Page List).
 * @param {Object} props.listViewProps      Remaining props, passed to `PrivateListView`.
 */
export default function NavigationMenuListView( {
	rootClientId,
	navigationClientId = rootClientId,
	...listViewProps
} ) {
	const isEnabled = isNavigationMenuEditingEnabled();
	const submenuAppenderParentIds = useSubmenuAppenderParentIds(
		isEnabled ? navigationClientId : null
	);
	const isAutoMenu = useIsAutoMenu( isEnabled ? navigationClientId : null );

	if ( ! isEnabled ) {
		return (
			<PrivateListView
				rootClientId={ rootClientId }
				{ ...listViewProps }
			/>
		);
	}

	if ( isAutoMenu ) {
		return <AutoMenu navigationClientId={ navigationClientId } />;
	}

	return (
		<PrivateListView
			{ ...listViewProps }
			rootClientId={ navigationClientId }
			renderAppender={ renderAppender }
			appenderParentClientIds={ submenuAppenderParentIds }
			dropOnRowToNest
		/>
	);
}
