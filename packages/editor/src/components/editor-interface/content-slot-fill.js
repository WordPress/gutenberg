/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const SLOT_FILL_NAME = 'EditCanvasContainerSlot';
const EditorContentSlotFill = createPrivateSlotFill( SLOT_FILL_NAME );

export default EditorContentSlotFill;
