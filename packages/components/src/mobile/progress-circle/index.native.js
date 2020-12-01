/**
 * External dependencies
 */
import * as React from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const CircularProgress = ( {
	progress,
	width = 50,
	strokeWidth = 50,
} ) => {
	const circleSize = width;
	const radius = ( circleSize - strokeWidth ) / 2;
	const cx = circleSize / 2;
	const cy = circleSize / 2;

	const { interpolate, multiply } = Animated;
	const { PI } = Math;
	const circumference = radius * 2 * PI;
	const α = interpolate( progress, {
		inputRange: [ 0, 1 ],
		outputRange: [ 0, PI * 2 ],
	} );

	const strokeDashoffset = multiply( α, radius );

	const AnimatedCircle = Animated.createAnimatedComponent( Circle );

	return (
		<Svg width={ circleSize } height={ circleSize }>
			<Circle
				{ ...{
					strokeWidth,
					cx,
					cy,
					radius,
					...styles[ 'background-circle' ],
				} }
			/>
			<AnimatedCircle
				strokeDasharray={ `${ circumference }, ${ circumference }` }
				{ ...{
					strokeDashoffset,
					strokeWidth,
					cx,
					cy,
					radius,
					...styles[ 'progress-circle' ],
				} }
			/>
		</Svg>
	);
};
