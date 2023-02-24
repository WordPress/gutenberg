/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

export default function useDisplayBlockControls() {
	return useBlockEditContext().shouldDisplayControls;
}
