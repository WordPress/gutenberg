/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Animate } from '..';
import Notice from '../../notice';

const meta: Meta< typeof Animate > = {
	title: 'Components/Animate',
	component: Animate,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
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

export const Loading = Template.bind( {} );
Loading.args = {
	type: 'loading',
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Loading animation.</p>
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
