/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';

/**
 * SettingsDrawer subcomponent for LinkControlV2.
 *
 * Collapsible drawer for link settings.
 */
export const SettingsDrawer = forwardRef< HTMLDivElement >(
	function SettingsDrawer( props, ref ) {
		useLinkControlV2Context();

		// TODO: Implement settings drawer
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__settings-drawer"
				{ ...props }
			>
				SettingsDrawer placeholder
			</div>
		);
	}
);

SettingsDrawer.displayName = 'LinkControlV2.SettingsDrawer';

