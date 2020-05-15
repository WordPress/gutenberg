/**
 * External dependencies
 */
import RNLinearGradient from 'react-native-linear-gradient';

function LinearGradient( {
	gradientValue,
	style,
	angleCenter = { x: 0.5, y: 0.5 },
	...otherProps
} ) {
	if ( ! gradientValue || ! gradientValue.includes( 'linear-gradient' ) ) {
		return null;
	}

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

export default LinearGradient;
