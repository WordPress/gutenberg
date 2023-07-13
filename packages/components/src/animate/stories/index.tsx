/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Animate } from '..';
import Notice from '../../notice';

const meta: ComponentMeta< typeof Animate > = {
	title: 'Components/Animate',
	component: Animate,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Animate > = ( props ) => (
	<Animate { ...props } />
);

export const Default: ComponentStory< typeof Animate > = Template.bind( {} );
Default.args = {
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>{ `No default animation. Use one of type = "appear", "slide-in", or "loading".` }</p>
		</Notice>
	),
};

export const AppearTopLeft: ComponentStory< typeof Animate > = Template.bind(
	{}
);
AppearTopLeft.args = {
	type: 'appear',
	options: { origin: 'top left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: top left.</p>
		</Notice>
	),
};
export const AppearTopRight: ComponentStory< typeof Animate > = Template.bind(
	{}
);
AppearTopRight.args = {
	type: 'appear',
	options: { origin: 'top right' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: top right.</p>
		</Notice>
	),
};
export const AppearBottomLeft: ComponentStory< typeof Animate > = Template.bind(
	{}
);
AppearBottomLeft.args = {
	type: 'appear',
	options: { origin: 'bottom left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: bottom left.</p>
		</Notice>
	),
};
export const AppearBottomRight: ComponentStory< typeof Animate > =
	Template.bind( {} );
AppearBottomRight.args = {
	type: 'appear',
	options: { origin: 'bottom right' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Appear animation. Origin: bottom right.</p>
		</Notice>
	),
};

export const Loading: ComponentStory< typeof Animate > = Template.bind( {} );
Loading.args = {
	type: 'loading',
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Loading animation.</p>
		</Notice>
	),
};

export const SlideIn: ComponentStory< typeof Animate > = Template.bind( {} );
SlideIn.args = {
	type: 'slide-in',
	options: { origin: 'left' },
	children: ( { className } ) => (
		<Notice className={ className } status="success">
			<p>Slide-in animation.</p>
		</Notice>
	),
};
