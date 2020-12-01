/**
 * External dependencies
 */
import * as React from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */

const ProgressCircle = ( { progress, width = 20, strokeWidth = 2 } ) => {
	const circleSize = width;
	const r = ( circleSize - strokeWidth ) / 2;
	const cx = circleSize / 2;
	const cy = circleSize / 2;

	const { interpolate, multiply } = Animated;
	const { PI } = Math;
	const circumference = r * 2 * PI;
	const α = interpolate( progress, {
		inputRange: [ 0, 100 ],
		outputRange: [ 0, PI * 2 ],
	} );

	const strokeDashoffset = multiply( α, r );

	const AnimatedCircle = Animated.createAnimatedComponent( Circle );

	return (
		<Svg width={ circleSize } height={ circleSize }>
			<Circle
				fill="none"
				stroke="#e9eff3"
				{ ...{
					strokeWidth,
					cx,
					cy,
					r,
				} }
			/>
			<AnimatedCircle
				strokeDasharray={ `${ circumference }, ${ circumference }` }
				fill="none"
				stroke="#0087be"
				{ ...{
					strokeDashoffset,
					strokeWidth,
					cx,
					cy,
					r,
				} }
			/>
		</Svg>
	);
};

export default ProgressCircle;
