/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import {
	SVG,
	G,
	Rect,
	Defs,
	RadialGradient,
	LinearGradient,
	Stop,
} from '@wordpress/primitives';

/**
 * Internal dependencies
 */
export const LinearGradientIcon = withInstanceId( ( { instanceId } ) => {
	const linerGradientId = `linear-gradient-${ instanceId }`;
	return (
		<SVG width="20" height="20" xmlns="http://www.w3.org/2000/svg">
			<Defs>
				<LinearGradient
					y2="0"
					x2="0.5"
					y1="1"
					x1="0.5"
					id={ linerGradientId }
				>
					<Stop offset="0" stopColor="#000000" />
					<Stop offset="1" stopColor="#fff" />
				</LinearGradient>
			</Defs>
			<G>
				<Rect
					fill={ `url(#${ linerGradientId })` }
					height="20"
					width="20"
					y="-1"
					x="-1"
				/>
			</G>
		</SVG>
	);
} );

export const RadialGradientIcon = withInstanceId( ( { instanceId } ) => {
	const radialGradientId = `radial-gradient-${ instanceId }`;
	return (
		<SVG width="20" height="20" xmlns="http://www.w3.org/2000/svg">
			<Defs>
				<RadialGradient
					cy="0.5"
					cx="0.5"
					spreadMethod="pad"
					id={ radialGradientId }
				>
					<Stop offset="0" stopColor="#fff" />
					<Stop offset="1" stopColor="#000000" />
				</RadialGradient>
			</Defs>
			<G>
				<Rect
					fill={ `url(#${ radialGradientId })` }
					height="20"
					width="20"
					y="-1"
					x="-1"
				/>
			</G>
		</SVG>
	);
} );
