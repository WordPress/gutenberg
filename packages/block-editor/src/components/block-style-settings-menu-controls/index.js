/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'BlockStyleSettingsMenuControls' );

/**
 * Slot component used inside the styles menu group of the block settings
 * dropdown. Exposes fills via a render prop so the caller can compose them
 * alongside other items (e.g. copy/paste styles) within a shared MenuGroup.
 *
 * @param {Object}   props
 * @param {Object}   props.fillProps Props forwarded to each Fill.
 * @param {Function} props.children  Render prop: `( fills ) => ReactNode`.
 */
export function BlockStyleSettingsMenuControlsSlot( { fillProps, children } ) {
	return <Slot fillProps={ fillProps }>{ children }</Slot>;
}

/**
 * Fill component for adding items into the styles section of the block
 * settings dropdown (alongside copy/paste styles).
 *
 * @param {Object} props Fill props, including the render-prop children.
 * @return {Element} Element.
 */
function BlockStyleSettingsMenuControls( { ...props } ) {
	return (
		<StyleProvider document={ document }>
			<Fill { ...props } />
		</StyleProvider>
	);
}

BlockStyleSettingsMenuControls.Slot = BlockStyleSettingsMenuControlsSlot;

export default BlockStyleSettingsMenuControls;
