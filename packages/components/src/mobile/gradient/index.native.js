/**
 * External dependencies
 */
import { View, Platform } from 'react-native';
import RNLinearGradient from 'react-native-linear-gradient';
import gradientParser from 'gradient-parser';
/**
 * WordPress dependencies
 */
import { colorsUtils } from '@wordpress/components';
import { RadialGradient, Stop, SVG, Defs, Rect } from '@wordpress/primitives';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export function getGradientAngle( gradientValue ) {
	const angleBase = 45;
	const matchAngle = /\(((\d+deg)|(to\s[^,]+))/;
	const angle = matchAngle.exec( gradientValue )
		? matchAngle.exec( gradientValue )[ 1 ]
		: '180deg';

	const angleType = angle.includes( 'deg' ) ? 'angle' : 'sideOrCorner';

	if ( angleType === 'sideOrCorner' ) {
		switch ( angle ) {
			case 'to top':
				return 0;
			case 'to top right':
			case 'to right top':
				return angleBase;
			case 'to right':
				return 2 * angleBase;
			case 'to bottom right':
			case 'to right bottom':
				return 3 * angleBase;
			case 'to bottom':
				return 4 * angleBase;
			case 'to bottom left':
			case 'to left bottom':
				return 5 * angleBase;
			case 'to left':
				return 6 * angleBase;
			case 'to top left':
			case 'to left top':
				return 7 * angleBase;
		}
	} else if ( angleType === 'angle' ) {
		return parseFloat( angle );
	} else return 4 * angleBase;
}

export function getGradientColorGroup( gradientValue ) {
	const colorNeedParenthesis = [ 'rgb', 'rgba' ];

	const excludeSideOrCorner = /linear-gradient\(to\s+([a-z\s]+,)/;

	// Parser has some difficulties with angle defined as a side or corner (e.g. `to left`)
	// so it's going to be excluded in order to matching color groups.
	const modifiedGradientValue = gradientValue.replace(
		excludeSideOrCorner,
		'linear-gradient('
	);

	return [].concat(
		...gradientParser.parse( modifiedGradientValue )?.map( ( gradient ) =>
			gradient.colorStops?.map( ( color, index ) => {
				const { type, value, length } = color;
				const fallbackLength = `${
					100 * ( index / ( gradient.colorStops.length - 1 ) )
				}%`;
				const colorLength = length
					? `${ length.value }${ length.type }`
					: fallbackLength;

				if ( colorNeedParenthesis.includes( type ) ) {
					return [ `${ type }(${ value.join( ',' ) })`, colorLength ];
				} else if ( type === 'literal' ) {
					return [ value, colorLength ];
				}
				return [ `#${ value }`, colorLength ];
			} )
		)
	);
}

export function getGradientBaseColors( colorGroup ) {
	return colorGroup.map( ( color ) => color[ 0 ] );
}

export function getColorLocations( colorGroup ) {
	return colorGroup.map(
		( location ) => Number( location[ 1 ].replace( '%', '' ) ) / 100
	);
}

function Gradient( {
	gradientValue,
	style,
	angleCenter = { x: 0.5, y: 0.5 },
	children,
	...otherProps
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { width = 0, height = 0 } = sizes || {};
	const { isGradient, getGradientType, gradients } = colorsUtils;

	const colorGroup = useMemo( () => getGradientColorGroup( gradientValue ), [
		gradientValue,
	] );

	const locations = useMemo( () => getColorLocations( colorGroup ), [
		colorGroup,
	] );

	const colors = useMemo( () => getGradientBaseColors( colorGroup ), [
		colorGroup,
	] );

	if ( ! gradientValue || ! isGradient( gradientValue ) ) {
		return null;
	}

	const isLinearGradient =
		getGradientType( gradientValue ) === gradients.linear;

	if ( isLinearGradient ) {
		return (
			<RNLinearGradient
				colors={ colors }
				useAngle={ true }
				angle={ getGradientAngle( gradientValue ) }
				locations={ locations }
				angleCenter={ angleCenter }
				style={ style }
				{ ...otherProps }
			>
				{ children }
			</RNLinearGradient>
		);
	}

	return (
		<View style={ [ style, styles.overflow ] }>
			<View style={ styles.radialGradientContent }>{ children }</View>
			{ resizeObserver }
			<SVG>
				<Defs>
					<RadialGradient
						// eslint-disable-next-line no-restricted-syntax
						id="radialGradient"
						gradientUnits="userSpaceOnUse"
						rx="70%"
						ry="70%"
						cy={ Platform.OS === 'android' ? width / 2 : '50%' }
					>
						{ colorGroup.map( ( group ) => {
							return (
								<Stop
									offset={ group[ 1 ] }
									stopColor={ group[ 0 ] }
									stopOpacity="1"
									key={ `${ group[ 1 ] }-${ group[ 0 ] }` }
								/>
							);
						} ) }
					</RadialGradient>
				</Defs>
				<Rect
					height={ height }
					width={ width }
					fill="url(#radialGradient)"
				/>
			</SVG>
		</View>
	);
}

export default Gradient;
