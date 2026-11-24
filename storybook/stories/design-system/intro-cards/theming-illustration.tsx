import { Illustration } from './illustration';
import { brand, r } from './palette';

/** Color swatches in a ramp, above a row of token-like bars. */
export const ThemingIllustration = () => (
	<Illustration>
		{ [ 0.2, 0.4, 0.6, 0.8, 1 ].map( ( o, i ) => (
			<rect
				key={ i }
				x={ 40 + i * 48 }
				y={ 36 }
				width="40"
				height="56"
				style={ r.lg }
				fill={ brand }
				opacity={ o }
			/>
		) ) }
		{ [ 0.2, 0.4, 0.6, 0.8, 1 ].map( ( o, i ) => (
			<rect
				key={ i }
				x={ 40 + i * 48 }
				y={ 104 }
				width="40"
				height="6"
				rx="3"
				fill={ brand }
				opacity={ o }
			/>
		) ) }
	</Illustration>
);
