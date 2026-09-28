import { expect } from 'storybook/test';
import { logged } from '@wordpress/deprecated';
import type { Meta, StoryFn } from '@storybook/react-vite';
import { Animate } from '..';
import Notice from '../../notice';

const meta: Meta< typeof Animate > = {
	title: 'Components/@wordpress-components/Deprecated/Animate',
	id: 'components-animate',
	component: Animate,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Deprecated. Write your own CSS animations instead, preferably using the [`motion tokens`](?path=/docs/design-system-tokens-introduction--docs) available in `@wordpress/theme`.',
		},
	},
	play: () => {
		expect(
			logged[
				'wp.components.Animate is deprecated since version 7.2 and will be removed in version 7.4.'
			]
		).toBe( true );
	},
};
export default meta;

const Template: StoryFn< typeof Animate > = ( props ) => (
	<Animate { ...props } />
);

export const Default = Template.bind( {} );
Default.args = {
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>
				{ /* eslint-disable react/no-unescaped-entities */ }
				No default animation. Use one of type = "appear", "slide-in", or
				"loading".
				{ /* eslint-enable react/no-unescaped-entities */ }
			</p>
		</Notice>
	),
};

export const AppearTopLeft = Template.bind( {} );
AppearTopLeft.args = {
	type: 'appear',
	options: { origin: 'top left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: top left.</p>
		</Notice>
	),
};
export const AppearTopRight = Template.bind( {} );
AppearTopRight.args = {
	type: 'appear',
	options: { origin: 'top right' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: top right.</p>
		</Notice>
	),
};
export const AppearBottomLeft = Template.bind( {} );
AppearBottomLeft.args = {
	type: 'appear',
	options: { origin: 'bottom left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: bottom left.</p>
		</Notice>
	),
};
export const AppearBottomRight = Template.bind( {} );
AppearBottomRight.args = {
	type: 'appear',
	options: { origin: 'bottom right' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: bottom right.</p>
		</Notice>
	),
};

export const SlideIn = Template.bind( {} );
SlideIn.args = {
	type: 'slide-in',
	options: { origin: 'left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Slide-in animation.</p>
		</Notice>
	),
};
