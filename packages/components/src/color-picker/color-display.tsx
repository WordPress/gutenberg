/**
 * External dependencies
 */
import type { Colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Text } from '../text';
import { Flex, FlexItem } from '../flex';
import { Tooltip } from '../ui/tooltip';
import type { ColorType } from './types';
import { space } from '../ui/utils/space';
import { COLORS } from '../utils/colors-values';

interface ColorDisplayProps {
	color: Colord;
	colorType: ColorType;
	enableAlpha: boolean;
}

interface DisplayProps {
	color: Colord;
	enableAlpha: boolean;
}

type Values = [ number, string ][];

interface ValueDisplayProps {
	values: Values;
}

const ValueDisplay = ( { values }: ValueDisplayProps ) => (
	<>
		{ values.map( ( [ value, abbreviation ] ) => {
			return (
				<FlexItem key={ abbreviation } isBlock display="flex">
					<Text color={ COLORS.ui.theme }>{ abbreviation }</Text>
					<Text>{ value }</Text>
				</FlexItem>
			);
		} ) }
	</>
);

const HslDisplay = ( { color, enableAlpha }: DisplayProps ) => {
	const { h, s, l, a } = color.toHsl();

	const values: Values = [
		[ Math.floor( h ), 'H' ],
		[ Math.round( s * 100 ), 'S' ],
		[ Math.round( l * 100 ), 'L' ],
	];
	if ( enableAlpha ) {
		values.push( [ Math.round( a * 100 ), 'A' ] );
	}

	return <ValueDisplay values={ values } />;
};

const RgbDisplay = ( { color, enableAlpha }: DisplayProps ) => {
	const { r, g, b, a } = color.toRgb();

	const values: Values = [
		[ r, 'R' ],
		[ g, 'G' ],
		[ b, 'B' ],
	];

	if ( enableAlpha ) {
		values.push( [ Math.round( a * 100 ), 'A' ] );
	}

	return <ValueDisplay values={ values } />;
};

const HexDisplay = ( { color }: DisplayProps ) => {
	const colorWithoutHash = color.toHex().slice( 1 ).toUpperCase();
	return (
		<FlexItem>
			<Text color={ COLORS.ui.theme }>#</Text>
			<Text>{ colorWithoutHash }</Text>
		</FlexItem>
	);
};

const getComponent = ( colorType: ColorType ) => {
	switch ( colorType ) {
		case 'hsl':
			return HslDisplay;
		case 'rgb':
			return RgbDisplay;
		default:
		case 'hex':
			return HexDisplay;
	}
};

export const ColorDisplay = ( {
	color,
	colorType,
	enableAlpha,
}: ColorDisplayProps ) => {
	const [ copiedColor, setCopiedColor ] = useState< string | null >( null );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >();
	const props = { color, enableAlpha };
	const Component = getComponent( colorType );
	const copyRef = useCopyToClipboard< HTMLDivElement >(
		() => {
			switch ( colorType ) {
				case 'hsl': {
					return color.toHslString();
				}
				case 'rgb': {
					return color.toRgbString();
				}
				default:
				case 'hex': {
					return color.toHex();
				}
			}
		},
		() => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
			setCopiedColor( color.toHex() );
			copyTimer.current = setTimeout( () => {
				setCopiedColor( null );
				copyTimer.current = undefined;
			}, 3000 );
		}
	);
	useEffect( () => {
		// Clear copyTimer on component unmount.
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );
	return (
		<Tooltip
			content={
				<Text color="white">
					{ copiedColor === color.toHex()
						? __( 'Copied!' )
						: __( 'Copy' ) }
				</Text>
			}
		>
			<Flex
				justify="flex-start"
				gap={ space( 1 ) }
				ref={ copyRef }
				style={ { height: 30 } }
			>
				<Component { ...props } />
			</Flex>
		</Tooltip>
	);
};
