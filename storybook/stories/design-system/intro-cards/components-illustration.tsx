import { Illustration } from './illustration';
import { brand, neutral, surface, stroke, r } from './palette';

/** A button, a text field, a toggle and a checkbox. */
export const ComponentsIllustration = () => (
	<Illustration>
		<rect
			x="40"
			y="32"
			width="96"
			height="32"
			style={ r.sm }
			fill={ brand }
		/>
		<rect
			x="148"
			y="32"
			width="96"
			height="32"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="160"
			y="45"
			width="72"
			height="6"
			rx="3"
			fill={ neutral }
			opacity="0.5"
		/>
		<rect
			x="40"
			y="80"
			width="204"
			height="32"
			style={ r.sm }
			fill={ surface }
			stroke={ stroke }
		/>
		<rect
			x="52"
			y="93"
			width="80"
			height="6"
			rx="3"
			fill={ neutral }
			opacity="0.5"
		/>
		<rect x="256" y="40" width="32" height="18" rx="9" fill={ brand } />
		<circle cx="279" cy="49" r="6" fill={ surface } />
		<rect
			x="256"
			y="86"
			width="20"
			height="20"
			style={ r.xs }
			fill={ brand }
		/>
		<path
			d="M261 96l4 4 7-8"
			fill="none"
			stroke={ surface }
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Illustration>
);
