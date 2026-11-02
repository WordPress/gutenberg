import type { Action } from '../types';

/**
 * The `aria-haspopup` value of an action's trigger: `dialog` when the action
 * opens one, either its own modal or one its callback opens.
 *
 * @param action The action.
 */
export default function getActionPopup< Item >( action: Action< Item > ) {
	return 'RenderModal' in action || action.opensDialog
		? ( 'dialog' as const )
		: undefined;
}
