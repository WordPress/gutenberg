/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import ResponsiveWrapper from '..';

const meta: ComponentMeta< typeof ResponsiveWrapper > = {
	component: ResponsiveWrapper,
	title: 'Components/ResponsiveWrapper',
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ResponsiveWrapper > = ( args ) => (
	<ResponsiveWrapper { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	naturalWidth: 2000,
	naturalHeight: 680,
	children: (
		<img
			src="https://s.w.org/style/images/about/WordPress-logotype-standard.png"
			alt="WordPress"
		/>
	),
};

/**
 * Since SVG images don't have the equivalent of a natural width and height,
 * it is possible that the `naturalWidth` and `naturalHeight` properties are not
 * specified. In this case, the SVG simply keeps scaling up to fill its
 * container, unless the `height` and `width` attributes are specified.
 */
export const WithSVG: ComponentStory< typeof ResponsiveWrapper > =
	Template.bind( {} );
WithSVG.args = {
	children: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 280 640"
			preserveAspectRatio="xMinYMin meet"
			width="280px"
			height="640px"
		>
			<rect
				x="0"
				y="0"
				width="280"
				height="640"
				style={ { fill: 'blue' } }
			/>
			<g>
				<circle style={ { fill: 'red' } } cx="140" cy="160" r="60" />
				<circle style={ { fill: 'yellow' } } cx="140" cy="320" r="60" />
				<circle
					style={ { fill: '#40CC40' } }
					cx="140"
					cy="480"
					r="60"
				/>
			</g>
		</svg>
	),
};
