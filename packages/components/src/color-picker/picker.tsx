/**
 * External dependencies
 */
import { HslStringColorPicker, HslaStringColorPicker } from 'react-colorful';
import type { HslaColor } from 'react-colorful';

/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

function hslaToHslString( { h, s, l }: HslaColor ): string {
	return `hsl(${ h }, ${ s }%, ${ l }%)`;
}

function hslaToHslaString( { h, s, l, a }: HslaColor ): string {
	return `hsla(${ h }, ${ s }%, ${ l }%, ${ a })`;
}

function parseHslString( str: string ): HslaColor {
	const match = str.match(
		/hsla?\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\s*\)/
	);
	if ( ! match ) {
		return { h: 0, s: 0, l: 0, a: 1 };
	}
	return {
		h: Math.round( parseFloat( match[ 1 ] ) ),
		s: Math.round( parseFloat( match[ 2 ] ) ),
		l: Math.round( parseFloat( match[ 3 ] ) ),
		a: match[ 4 ] !== undefined ? parseFloat( match[ 4 ] ) : 1,
	};
}

export const Picker = ( { hsla, enableAlpha, onChange }: PickerProps ) => {
	const Component = enableAlpha
		? HslaStringColorPicker
		: HslStringColorPicker;
	const colorString = enableAlpha
		? hslaToHslaString( hsla )
		: hslaToHslString( hsla );

	return (
		<Component
			color={ colorString }
			onChange={ ( nextColor ) => {
				onChange( parseHslString( nextColor ) );
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
