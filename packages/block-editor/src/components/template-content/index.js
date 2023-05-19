/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: TemplateContent, Slot } = createSlotFill( 'TemplateContent' );

TemplateContent.Slot = Slot;

export default TemplateContent;
