/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';

/**
 * Actions subcomponent for LinkControlV2.
 *
 * Provides Apply and Cancel buttons.
 */
export const Actions = forwardRef< HTMLDivElement >(
	function Actions( props, ref ) {
		useLinkControlV2Context();

		// TODO: Implement actions
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__actions"
				{ ...props }
			>
				Actions placeholder
			</div>
		);
	}
);

Actions.displayName = 'LinkControlV2.Actions';

