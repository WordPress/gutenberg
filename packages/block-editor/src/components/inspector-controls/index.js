/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	createSlotFill,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

function InspectorControls( { children } ) {
	return useDisplayBlockControls() ? (
		<StyleProvider document={ document }>
			<Fill>{ children }</Fill>
		</StyleProvider>
	) : null;
}

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
