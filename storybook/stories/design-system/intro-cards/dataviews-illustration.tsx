import { Illustration } from './illustration';
import { brand, neutral, surface, stroke, muted, r } from './palette';

/** A table with a filter bar and selectable rows. */
export const DataViewsIllustration = () => (
	<Illustration>
		<rect
			x="40"
			y="24"
			width="240"
			height="112"
			style={ r.lg }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="52"
			y="36"
			width="64"
			height="14"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="124"
			y="36"
			width="40"
			height="14"
			style={ r.sm }
			fill={ brand }
		/>
		{ [ 0, 1, 2, 3 ].map( ( i ) => {
			const top = 62 + i * 18;
			return (
				<g key={ i }>
					<line
						x1="40"
						x2="280"
						y1={ top }
						y2={ top }
						stroke={ muted }
					/>
					<rect
						x="52"
						y={ top + 5 }
						width="8"
						height="8"
						style={ r.xs }
						fill={ i === 1 ? brand : 'none' }
						stroke={ i === 1 ? brand : stroke }
					/>
					<rect
						x="74"
						y={ top + 6 }
						width={ 70 + ( ( i * 23 ) % 40 ) }
						height="6"
						rx="3"
						fill={ neutral }
						opacity="0.5"
					/>
					<rect
						x="200"
						y={ top + 6 }
						width="60"
						height="6"
						rx="3"
						fill={ neutral }
						opacity="0.25"
					/>
				</g>
			);
		} ) }
	</Illustration>
);
