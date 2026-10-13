import type {
	WidgetCallbackAction,
	WidgetRuntimeAction,
} from '@wordpress/widget-primitives';

/**
 * Whether a callback fulfills the action.
 *
 * @param {WidgetRuntimeAction} action The action to test.
 */
export function isCallbackAction(
	action: WidgetRuntimeAction
): action is WidgetCallbackAction {
	return 'callback' in action;
}
