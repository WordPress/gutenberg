/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';

/**
 * Settings subcomponent for LinkControlV2.
 *
 * Collapsible drawer for link settings.
 */
export const Settings = forwardRef< HTMLDivElement >(
	function Settings( props, ref ) {
		useLinkControlV2Context();

		// TODO: Implement settings
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__settings"
				{ ...props }
			>
				Settings placeholder
			</div>
		);
	}
);

Settings.displayName = 'LinkControlV2.Settings';

