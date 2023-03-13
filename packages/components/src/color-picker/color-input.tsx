/**
 * External dependencies
 */
import type { Colord } from 'colord';

/**
 * Internal dependencies
 */
import { RgbInput } from './rgb-input';
import { HslInput } from './hsl-input';
import { HexInput } from './hex-input';

interface ColorInputProps {
	colorType: 'hsl' | 'hex' | 'rgb';
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export const ColorInput = ( {
	colorType,
	color,
	onChange,
	enableAlpha,
}: ColorInputProps ) => {
	const props = { color, onChange, enableAlpha };
	switch ( colorType ) {
		case 'hsl':
			return <HslInput { ...props } />;
		case 'rgb':
			return <RgbInput { ...props } />;
		default:
		case 'hex':
			return <HexInput { ...props } />;
	}
};
