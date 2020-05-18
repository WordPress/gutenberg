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

function Gradient( {
	gradientValue,
	style,
	angleCenter = { x: 0.5, y: 0.5 },
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

	const matchColorGroup = /(rgba|rgb|#)(.+?)[\%]/g;
	const matchDeg = /(\d.+)deg/g;

	const colorGroup = gradientValue
		.match( matchColorGroup )
		.map( ( color ) => color.split( ' ' ) );

	const colors = colorGroup.map( ( color ) => color[ 0 ] );
	const locations = colorGroup.map(
		( location ) => Number( location[ 1 ].replace( '%', '' ) ) / 100
	);

	const angle =
		isLinearGradient && Number( matchDeg.exec( gradientValue )[ 1 ] );

	if ( isLinearGradient ) {
		return (
			<RNLinearGradient
				colors={ colors }
				useAngle={ true }
				angle={ angle }
				locations={ locations }
				angleCenter={ angleCenter }
				style={ style }
				{ ...otherProps }
			/>
		);
	}

	return (
		<View style={ [ style, styles.overflow ] }>
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
									key={ group[ 0 ] }
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
