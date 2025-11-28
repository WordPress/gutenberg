/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';

/**
 * TextControl subcomponent for LinkControlV2.
 *
 * Optional text input for link title/text.
 */
export const TextControl = forwardRef< HTMLInputElement >(
	function TextControl( props, ref ) {
		useLinkControlV2Context();

		// TODO: Implement text control
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__text-control"
				{ ...props }
			>
				TextControl placeholder
			</div>
		);
	}
);

TextControl.displayName = 'LinkControlV2.TextControl';

