/**
 * External dependencies
 */
import { HslColorPicker, HslaColorPicker } from 'react-colorful';

/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

export const Picker = ( { hsla, enableAlpha, onChange }: PickerProps ) => {
	if ( enableAlpha ) {
		return (
			<HslaColorPicker
				color={ hsla }
				onChange={ onChange }
				// Pointer capture fortifies drag gestures so that they
				// continue to work while dragging outside the component
				// over objects like iframes. If a newer version of
				// react-colorful begins to employ pointer capture this
				// will be redundant and should be removed.
				onPointerDown={ ( { currentTarget, pointerId } ) => {
					currentTarget.setPointerCapture( pointerId );
				} }
				onPointerUp={ ( { currentTarget, pointerId } ) => {
					currentTarget.releasePointerCapture( pointerId );
				} }
			/>
		);
	}

	return (
		<HslColorPicker
			color={ hsla }
			onChange={ ( nextColor ) => {
				onChange( { ...nextColor, a: hsla.a } );
			} }
			// Pointer capture fortifies drag gestures so that they continue to
			// work while dragging outside the component over objects like
			// iframes. If a newer version of react-colorful begins to employ
			// pointer capture this will be redundant and should be removed.
			onPointerDown={ ( { currentTarget, pointerId } ) => {
				currentTarget.setPointerCapture( pointerId );
			} }
			onPointerUp={ ( { currentTarget, pointerId } ) => {
				currentTarget.releasePointerCapture( pointerId );
			} }
		/>
	);
};
