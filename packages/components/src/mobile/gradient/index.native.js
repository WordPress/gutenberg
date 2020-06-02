/**
 * External dependencies
 */
import { View, Platform } from 'react-native';
import RNLinearGradient from 'react-native-linear-gradient';
/**
 * WordPress dependencies
 */
import { colorsUtils } from '@wordpress/components';
import { RadialGradient, Stop, SVG, Defs, Rect } from '@wordpress/primitives';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function getGradientAngle( gradientValue ) {
	const matchDeg = /(\d+)deg/g;

	return Number( matchDeg.exec( gradientValue )[ 1 ] );
}

function getGradientColorGroup( gradientValue ) {
	const matchColorGroup = /(rgba|rgb|#)(.+?)[\%]/g;

	return gradientValue
		.match( matchColorGroup )
		.map( ( color ) => color.split( ' ' ) );
}

function getGradientBaseColors( gradientValue ) {
	return getGradientColorGroup( gradientValue ).map(
		( color ) => color[ 0 ]
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

	if ( ! gradientValue || ! isGradient( gradientValue ) ) {
		return null;
	}

	const isLinearGradient =
		getGradientType( gradientValue ) === gradients.linear;

	const colorGroup = getGradientColorGroup( gradientValue );

	const locations = colorGroup.map(
		( location ) => Number( location[ 1 ].replace( '%', '' ) ) / 100
	);

	if ( isLinearGradient ) {
		return (
			<RNLinearGradient
				colors={ getGradientBaseColors( gradientValue ) }
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
						//eslint-disable-next-line no-restricted-syntax
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
export { getGradientBaseColors };
