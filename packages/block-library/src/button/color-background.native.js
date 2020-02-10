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

function OutlineWrapper( {
	children,
	borderRadiusValue,
	isSelected,
	backgroundColor,
} ) {
	const outlineBorderRadius =
		borderRadiusValue > 0
			? borderRadiusValue +
			  styles.button.paddingTop +
			  styles.button.borderWidth
			: 0;

	return (
		<View
			style={ [
				styles.container,
				isSelected && {
					borderRadius: outlineBorderRadius,
					borderWidth: styles.button.borderWidth,
					borderColor: backgroundColor,
					padding: styles.button.paddingTop,
				},
			] }
		>
			{ children }
		</View>
	);
}

function ColorBackground( {
	children,
	borderRadiusValue,
	backgroundColor,
	isSelected,
} ) {
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
			<OutlineWrapper
				backgroundColor={ backgroundColor }
				borderRadiusValue={ borderRadiusValue }
				isSelected={ isSelected }
			>
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
			</OutlineWrapper>
		);
	}
	return (
		<OutlineWrapper
			backgroundColor={ backgroundColor }
			borderRadiusValue={ borderRadiusValue }
			isSelected={ isSelected }
		>
			<View style={ wrapperStyles }>{ children }</View>
		</OutlineWrapper>
	);
}

export default ColorBackground;
