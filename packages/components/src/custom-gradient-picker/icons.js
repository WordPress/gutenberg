/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import {
	Circle,
	LinearGradient,
	Path,
	RadialGradient,
	Stop,
	SVG,
} from '@wordpress/primitives';

/**
 * Internal dependencies
 */
export const LinearGradientIcon = withInstanceId( ( { instanceId } ) => {
	const linerGradientId = `linear-gradient-${ instanceId }`;
	return (
		<SVG
			fill="none"
			height="20"
			viewBox="0 0 20 20"
			width="20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<LinearGradient
				id={ linerGradientId }
				gradientUnits="userSpaceOnUse"
				x1="10"
				x2="10"
				y1="1"
				y2="19"
			>
				<Stop offset="0" stopColor="#000000" />
				<Stop offset="1" stopColor="#ffffff" />
			</LinearGradient>
			<Path d="m1 1h18v18h-18z" fill={ `url(#${ linerGradientId })` } />
		</SVG>
	);
} );

export const RadialGradientIcon = withInstanceId( ( { instanceId } ) => {
	const radialGradientId = `radial-gradient-${ instanceId }`;
	return (
		<SVG
			fill="none"
			height="20"
			viewBox="0 0 20 20"
			width="20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<RadialGradient
				id={ radialGradientId }
				cx="0"
				cy="0"
				gradientTransform="matrix(0 9 -9 0 10 10)"
				gradientUnits="userSpaceOnUse"
				r="1"
			>
				<Stop offset="0" stopColor="#000000" />
				<Stop offset="1" stopColor="#ffffff" />
			</RadialGradient>
			<Circle
				cx="10"
				cy="10"
				fill={ `url(#${ radialGradientId })` }
				r="9"
			/>
		</SVG>
	);
} );
