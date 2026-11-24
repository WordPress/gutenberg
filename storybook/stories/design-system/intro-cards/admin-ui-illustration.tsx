import { Illustration } from './illustration';
import {
	brand,
	neutral,
	surface,
	surfaceWeak,
	stroke,
	muted,
	r,
} from './palette';

/** A page frame: full-height sidebar, header with one primary action, content. */
export const AdminUIIllustration = () => (
	<Illustration>
		<clipPath id="package-cards-admin-ui-frame">
			<rect x="40" y="20" width="240" height="120" style={ r.lg } />
		</clipPath>
		<rect
			x="40"
			y="20"
			width="240"
			height="120"
			style={ r.lg }
			fill={ surface }
		/>
		<g clipPath="url(#package-cards-admin-ui-frame)">
			<rect x="40" y="20" width="60" height="120" fill={ surfaceWeak } />
		</g>
		<line x1="100" x2="100" y1="20" y2="140" stroke={ muted } />
		<line x1="100" x2="280" y1="46" y2="46" stroke={ muted } />
		<rect x="52" y="30" width="24" height="8" rx="4" fill={ neutral } />
		{ [ 0, 1, 2, 3 ].map( ( i ) => (
			<rect
				key={ i }
				x="52"
				y={ 58 + i * 18 }
				width="36"
				height="6"
				rx="3"
				fill={ neutral }
				opacity={ i === 0 ? 0.7 : 0.35 }
			/>
		) ) }
		<rect
			x="112"
			y="30"
			width="56"
			height="8"
			rx="4"
			fill={ neutral }
			opacity="0.6"
		/>
		<rect
			x="244"
			y="28"
			width="24"
			height="12"
			style={ r.sm }
			fill={ brand }
		/>
		<rect
			x="112"
			y="58"
			width="156"
			height="28"
			style={ r.sm }
			fill={ surfaceWeak }
		/>
		<rect
			x="112"
			y="96"
			width="156"
			height="32"
			style={ r.sm }
			fill={ surfaceWeak }
		/>
		<rect
			x="40"
			y="20"
			width="240"
			height="120"
			style={ r.lg }
			fill="none"
			stroke={ stroke }
		/>
	</Illustration>
);
