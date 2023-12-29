/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

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

const meta: Meta< typeof Icon > = {
	title: 'Components/Icon',
	component: Icon,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Icon > = ( args ) => <Icon { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	icon: wordpress,
};

/**
 * When `icon` is an SVG element, the `currentColor` prop can be used to
 * render it in the CSS `currentColor`.
 */
export const WithCurrentColor: StoryFn< typeof Icon > = ( args ) => {
	return (
		<div
			style={ {
				background: 'blue',
				color: 'white',
			} }
		>
			<Icon { ...args } />
			Some text
		</div>
	);
};
WithCurrentColor.args = {
	...Default.args,
	currentColor: true,
};

const renderIcon = ( { size = 24, ...restProps } ) => (
	<div style={ { width: size } } { ...restProps }>
		<SVG viewBox="0 0 24 24">
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	</div>
);

export const WithAFunction = Template.bind( {} );
WithAFunction.args = {
	...Default.args,
	icon: renderIcon,
};
WithAFunction.parameters = {
	docs: {
		source: {
			code: `
const renderIcon = ( { size = 24, ...restProps } ) => (
	<div style={ { width: size } } { ...restProps }>
		<SVG viewBox="0 0 24 24">
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	</div>
);

<Icon icon={ renderIcon } />
			`,
		},
	},
};

const MyIconComponent = renderIcon;

export const WithAComponent = Template.bind( {} );
WithAComponent.args = {
	...Default.args,
	icon: MyIconComponent,
};
WithAComponent.parameters = {
	docs: {
		source: {
			code: `
const MyIconComponent = ( { size = 24, ...restProps } ) => (
	<div style={ { width: size } } { ...restProps }>
		<SVG viewBox="0 0 24 24">
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	</div>
);

<Icon icon={ <MyIconComponent /> } />
			`,
		},
	},
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
export const WithADashicon: StoryFn< typeof Icon > = ( args ) => {
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
