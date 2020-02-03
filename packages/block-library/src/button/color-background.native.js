/**
 * External dependencies
 */
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
/**
 * WordPress dependencies
 */
import { __experimentalUseGradient } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColorBackground( { children, borderRadiusValue, backgroundColor } ) {
	const wrapperStyles = [
		styles.richTextWrapper,
		{
			borderRadius: borderRadiusValue,
			backgroundColor,
		},
	];

	const { gradientValue } = __experimentalUseGradient();

	function transformGradient() {
		const matchColorGroup = /(rgba|rgb|#)(.+?)[\%]/g;
		const matchDeg = /(\d.+)deg/g;

		const colorGroup = gradientValue
			.match( matchColorGroup )
			.map( ( color ) => color.split( ' ' ) );

		const colors = colorGroup.map( ( color ) => color[ 0 ] );
		const locations = colorGroup.map(
			( location ) => Number( location[ 1 ].replace( '%', '' ) ) / 100
		);
		const angle = Number( matchDeg.exec( gradientValue )[ 1 ] );

		return {
			colors,
			locations,
			angle,
		};
	}

	if ( gradientValue ) {
		const { colors, locations, angle } = transformGradient();
		return (
			<LinearGradient
				colors={ colors }
				useAngle={ true }
				angle={ angle }
				locations={ locations }
				angleCenter={ { x: 0.5, y: 0.5 } }
				style={ wrapperStyles }
			>
				{ children }
			</LinearGradient>
		);
	}
	return <View style={ wrapperStyles }>{ children }</View>;
}

export default ColorBackground;
