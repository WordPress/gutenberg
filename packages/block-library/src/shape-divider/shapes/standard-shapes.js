/**
 * WordPress dependencies
 */
import { G, Path, SVG } from '@wordpress/primitives';

// IMPORTANT: All these are placeholder shapes to be replaced with custom designs

const getScaleTransform = ( height ) => {
	return height < 100 ? `scale(1,${ height / 100 })` : '';
}

const getScaleAndTranslate = ( height, totalHeight ) => {
	if ( height === 100 ) {
		return '';
	}

	const decimalHeight = height / 100;
	const translateY = ( 1 - decimalHeight ) * totalHeight;

	return `translate(0,${ translateY }) scale(1,${ decimalHeight })`;
}

// WavyShape nests SVG to make drawing the path easier while still supporting
// varying divider heights.
export const WavyShape = ( { color, height, opacity }, key ) => {
	const transform = `matrix(1 0 0 -1 0 10) ${ getScaleTransform( height ) }`;

	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 10"
			preserveAspectRatio="none"
			key={ key }
		>
			<Path
				d="m42.19.65c2.26-.25 5.15.04 7.55.53 2.36.49 7.09 2.35 10.05 3.57 7.58 3.22 13.37 4.45 19.26 4.97 2.36.21 4.87.35 10.34-.25s10.62-2.56 10.62-2.56v-6.91h-100.01v3.03s7.2 3.26 15.84 3.05c3.92-.07 9.28-.67 13.4-2.24 2.12-.81 5.22-1.82 7.97-2.42 2.72-.63 3.95-.67 4.98-.77z"
				fill={ color }
				opacity={ opacity }
				transform={ transform }
			/>
		</SVG>
	)
};

export const WavesShape = ( { color, height, opacity }, key ) => {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 1000 300"
			preserveAspectRatio="none"
			key={ key }
		>
			<G transform={ getScaleAndTranslate( height, 300 ) }>
				<Path
					d="M 1000 299 l 2 -279 c -155 -36 -310 135 -415 164 c -102.64 28.35 -149 -32 -232 -31 c -80 1 -142 53 -229 80 c -65.54 20.34 -101 15 -126 11.61 v 54.39 z"
					fill={ color }
					opacity={ opacity * 0.15 }
				/>
				<Path
					d="M 1000 286 l 2 -252 c -157 -43 -302 144 -405 178 c -101.11 33.38 -159 -47 -242 -46 c -80 1 -145.09 54.07 -229 87 c -65.21 25.59 -104.07 16.72 -126 10.61 v 22.39 z"
					fill={ color }
					opacity={ opacity * 0.3 }
				/>
				<Path
					d="M 1000 300 l 1 -230.29 c -217 -12.71 -300.47 129.15 -404 156.29 c -103 27 -174 -30 -257 -29 c -80 1 -130.09 37.07 -214 70 c -61.23 24 -108 15.61 -126 10.61 v 22.39 z"
					fill={ color }
					opacity={ opacity }
				/>
			</G>
		</SVG>
	);
};

export const SlopedShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		key={ key }
	>
		<Path
			d="M0 100 C 20 0 50 0 100 100 Z"
			fill={ color }
			opacity={ opacity }
			transform={ getScaleAndTranslate( height, 100 ) }
		/>
	</SVG>
);

export const RoundedShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 240 24"
		preserveAspectRatio="none"
		key={ key }
	>
		<Path
			d="M119.849,0C47.861,0,0,24,0,24h240C240,24,191.855,0.021,119.849,0z"
			fill={ color }
			opacity={ opacity }
			key={ key }
			transform={ getScaleAndTranslate( height, 24 ) }
		/>
	</SVG>
);

export const AngledShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		key={ key }
	>
		<Path
			d="M 0 100 L 100 0 L 100 100 Z"
			fill={ color }
			opacity={ opacity }
			transform={ getScaleAndTranslate( height, 100 ) }
		/>
	</SVG>
);

export const TriangleShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		key={ key }
	>
		<Path
			d="M0 0 L 50 100 L 100 0Z"
			fill={ color }
			opacity={ opacity }
			transform={ `matrix(1 0 0 -1 0 100) ${ getScaleTransform( height ) }` }
		/>
	</SVG>
);

export const PointedShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 1000 100"
		preserveAspectRatio="none"
		key={ key }
	>
		<Path
			d="M737.9,94.7L0,0v100h1000V0L737.9,94.7z"
			fill={ color }
			opacity={ opacity }
			transform={ getScaleAndTranslate( height, 100 ) }
		/>
	</SVG>
);

export const HillsShape = ( { color, height, opacity }, key ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 1920 105"
		preserveAspectRatio="none"
		key={ key }
	>
		<G transform={ getScaleAndTranslate( height, 105 ) }>
			<Path
				d="m1920 14.8827052c-116.23325 0-224.05162 88.3906828-395.09265 88.3906828-160.92196 0-254.53172-83.4344997-444.90735-83.4344997-154.297581 0-240.095847 39.6344097-367.66819 39.6344097-154.121863 0-198.902329-36.1223133-349.458242-36.1223133-144.878137 0-241.175717 80.8685493-362.873568 80.8685493 0-34.0793243 0-68.1494291 0-102.219534h1920z"
				fill={ color }
				opacity={ opacity }
				transform="matrix(1 0 0 -1 0 105)"
			/>
			<Path
				d="m1920 14.6612844c-116.11434 0-223.9659 88.8291396-395.06196 88.8291396-160.92415 0-254.54487-83.7874573-444.93804-83.7874573-154.317311 0-240.088941 39.8974838-367.565152 39.8974838-154.034172 0-198.792715-36.4840402-349.164477-36.4840402-144.965828 0-241.283139 81.1250467-363.270371 81.1250467 0-34.7474052 0-69.4948104 0-104.241457h1920z"
				fill={ color }
				opacity={ opacity }
				transform="matrix(1 0 0 -1 0 105)"
			/>
		</G>
	</SVG>
);
