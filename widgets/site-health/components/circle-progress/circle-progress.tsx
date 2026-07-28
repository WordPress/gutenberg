/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import styles from './circle-progress.module.css';

export type HealthTone = 'success' | 'warning' | 'error';

// SVG circle geometry (matches WP core's site-health progress ring).
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CircleProgressProps {
	percentage: number;
	tone: HealthTone;
}

/* Progress ring; the health tone selects its stroke/fill via a CSS-module class. */
export function CircleProgress( { percentage, tone }: CircleProgressProps ) {
	const offset = CIRCUMFERENCE * ( 1 - percentage / 100 );

	return (
		<SVG
			className={ `${ styles.root } ${ styles[ tone ] }` }
			viewBox="0 0 200 200"
		>
			<Circle
				r={ RADIUS }
				cx="100"
				cy="100"
				fill="transparent"
				strokeDasharray={ CIRCUMFERENCE }
				strokeDashoffset={ 0 }
			/>

			<Circle
				r={ RADIUS }
				cx="100"
				cy="100"
				fill="transparent"
				strokeDasharray={ CIRCUMFERENCE }
				strokeDashoffset={ offset }
			/>

			<text
				x="100"
				y="100"
				textAnchor="middle"
				dominantBaseline="middle"
				className={ styles.percentage }
			>
				{ percentage }%
			</text>
		</SVG>
	);
}
