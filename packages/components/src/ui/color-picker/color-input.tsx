/**
 * Internal dependencies
 */
import { RgbInput } from './rgb-input';
import { HslInput } from './hsl-input';
import { HexInput } from './hex-input';

interface ColorInputProps {
	colorType: 'hsl' | 'hex' | 'rgb';
	color: string;
	onChange: ( value: string ) => void;
	disableAlpha: boolean;
}

export const ColorInput = ( {
	colorType,
	color,
	onChange,
	disableAlpha,
}: ColorInputProps ) => {
	const props = { color, onChange, disableAlpha };
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
