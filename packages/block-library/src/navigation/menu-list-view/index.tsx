import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { ForwardedRef } from 'react';
import { unlock } from '../../lock-unlock';
import isNavigationMenuEditingEnabled from './is-enabled';
import NavigationMenuAppender from './appender';
import type { NavigationMenuAppenderProps } from './appender';
import useSubmenuAppenderParentIds from './use-submenu-appender-parent-ids';
import AutoMenu, { useIsAutoMenu } from './auto-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );

function renderAppender(
	props: NavigationMenuAppenderProps & { ref?: ForwardedRef< HTMLElement > }
) {
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
 * @param props                    Component props.
 * @param props.rootClientId       Client id of the Navigation block.
 * @param props.navigationClientId Client id of the Navigation block, when `rootClientId` points elsewhere (for example a Page List).
 */
export default function NavigationMenuListView( {
	rootClientId,
	navigationClientId = rootClientId,
	...listViewProps
}: {
	rootClientId: string;
	navigationClientId?: string;
	// Remaining props, passed to `PrivateListView`, whose props aren't
	// exported.
	[ key: string ]: any;
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
