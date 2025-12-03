/**
 * Internal dependencies
 */
import { usePostPickerContext } from './context';
import type { OpenPostPicker } from './types';

/**
 * Hook to get the openPostPicker function from the PostPickerProvider context.
 *
 * @return The openPostPicker function that can be called to open the modal
 */
export function useOpenPostPicker(): OpenPostPicker {
	const { openPostPicker } = usePostPickerContext();
	return openPostPicker;
}

export default useOpenPostPicker;
