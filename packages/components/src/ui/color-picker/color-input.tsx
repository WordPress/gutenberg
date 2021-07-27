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
}

export const ColorInput = ( {
	colorType,
	color,
	onChange,
}: ColorInputProps ) => {
	switch ( colorType ) {
		case 'hsl':
			return <HslInput color={ color } onChange={ onChange } />;
		case 'rgb':
			return <RgbInput color={ color } onChange={ onChange } />;
		default:
		case 'hex':
			return <HexInput color={ color } onChange={ onChange } />;
	}
};
