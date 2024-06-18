/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const SLOT_FILL_NAME = 'EditCanvasContainerSlot';
const EditorContentSlotFill = createPrivateSlotFill( SLOT_FILL_NAME );

export function useHasEditorContentSlotFill() {
	const fills = useSlotFills( EditorContentSlotFill.privateKey );
	return !! fills?.length;
}

export default EditorContentSlotFill;
