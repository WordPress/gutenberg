/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Spacer } from '../../spacer';
import { space } from '../utils/space';

interface ColorDisplayProps {
	color: string;
	colorType: 'hex' | 'hsl' | 'rgb';
}

interface DisplayProps {
	color: string;
}

const HslDisplay = ( { color }: DisplayProps ) => {
	const { h, s, l } = colorize( color ).toHsl();

	return (
		<div>
			{ Math.floor( h ) }
			<Spacer as={ Text } marginRight={ space( 1 ) } color="blue">
				H
			</Spacer>
			{ Math.round( s * 100 ) }
			<Spacer as={ Text } marginRight={ space( 1 ) } color="blue">
				S
			</Spacer>
			{ Math.round( l * 100 ) }
			<Text color="blue">L</Text>
		</div>
	);
};

const RgbDisplay = ( { color }: DisplayProps ) => {
	const { r, g, b } = colorize( color ).toRgb();

	return (
		<div>
			{ r }
			<Spacer as={ Text } marginRight={ space( 1 ) } color="blue">
				R
			</Spacer>
			{ g }
			<Spacer as={ Text } marginRight={ space( 1 ) } color="blue">
				G
			</Spacer>
			{ b }
			<Text color="blue">B</Text>
		</div>
	);
};

const HexDisplay = ( { color }: DisplayProps ) => {
	const colorWithoutHash = color.slice( 1 );
	return (
		<>
			<Text>{ colorWithoutHash }</Text>
			<Text color="blue">#</Text>
		</>
	);
};

export const ColorDisplay = ( { color, colorType }: ColorDisplayProps ) => {
	switch ( colorType ) {
		case 'hsl':
			return <HslDisplay color={ color } />;
		case 'rgb':
			return <RgbDisplay color={ color } />;
		default:
		case 'hex':
			return <HexDisplay color={ color } />;
	}
};
