/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '..';
import { VStack } from '../../v-stack';

const meta: ComponentMeta< typeof Icon > = {
	title: 'Components/Icon',
	component: Icon,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Icon > = ( args ) => (
	<Icon { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	icon: wordpress,
};

export const FillColor: ComponentStory< typeof Icon > = ( args ) => {
	return (
		<div
			style={ {
				fill: 'blue',
			} }
		>
			<Icon { ...args } />
		</div>
	);
};
FillColor.args = {
	...Default.args,
};

export const WithAFunction = Template.bind( {} );
WithAFunction.args = {
	...Default.args,
	icon: () => (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	),
};

const MyIconComponent = () => (
	<SVG>
		<Path d="M5 4v3h5.5v12h3V7H19V4z" />
	</SVG>
);

export const WithAComponent = Template.bind( {} );
WithAComponent.args = {
	...Default.args,
	icon: MyIconComponent,
};

export const WithAnSVG = Template.bind( {} );
WithAnSVG.args = {
	...Default.args,
	icon: (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	),
};

/**
 * Although it's preferred to use icons from the `@wordpress/icons` package, Dashicons are still supported,
 * as long as you are in a context where the Dashicons stylesheet is loaded. To simulate that here,
 * use the Global CSS Injector in the Storybook toolbar at the top and select the "WordPress" preset.
 */
export const WithADashicon: ComponentStory< typeof Icon > = ( args ) => {
	return (
		<VStack>
			<Icon { ...args } />
			<small>
				This won’t show an icon if the Dashicons stylesheet isn’t
				loaded.
			</small>
		</VStack>
	);
};
WithADashicon.args = {
	...Default.args,
	icon: 'wordpress',
};
