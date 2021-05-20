/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { OnCaretVerticalPositionChange } from '../block-list';

export function useNativeProps() {
	return {
		onCaretVerticalPositionChange: useContext(
			OnCaretVerticalPositionChange
		),
	};
}
