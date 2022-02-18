/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'WelcomeGuide' );

const WelcomeGuide = ( { children } ) => <Fill>{ children }</Fill>;

WelcomeGuide.Slot = Slot;

export default WelcomeGuide;
