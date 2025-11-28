/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';

/**
 * Preview subcomponent for LinkControlV2.
 *
 * Displays the committed link value with edit/unlink actions.
 */
export const Preview = forwardRef< HTMLDivElement >(
	function Preview( props, ref ) {
		const context = useLinkControlV2Context();

		// TODO: Implement preview UI
		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__preview"
				{ ...props }
			>
				Preview placeholder - { context.committedValue?.url }
			</div>
		);
	}
);

Preview.displayName = 'LinkControlV2.Preview';

