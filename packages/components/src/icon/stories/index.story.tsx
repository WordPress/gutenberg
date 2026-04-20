/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';
import * as icons from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon, { type Props, type IconType } from '..';
import { VStack } from '../../v-stack';

type IconProps = Props & {
	additionalProps: object;
};

const meta: Meta< IconProps > = {
	title: 'Components/Icon',
	component: Icon,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'stable',
			whereUsed: 'global',
			notes: 'Prefer this component over the `Icon` component from `@wordpress/icons`.',
		},
	},
	args: {
		additionalProps: {},
		size: 24,
	},
	argTypes: {
		size: {
			control: {
				type: 'range',
				min: 1,
				max: 200,
			},
		},
		additionalProps: {
			defaultValue: {},
			table: {
				type: { summary: 'object' },
			},
		},
	},
};
export default meta;

const Template: StoryFn< IconProps > = function ( args ) {
	const { additionalProps, ...rest } = args;
	const props = {
		...rest,
		...additionalProps,
	};
	return <Icon { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	icon: icons.wordpress,
};

export const FillColor = Template.bind( {} );

FillColor.args = {
	...Default.args,
	additionalProps: {
		fill: 'blue',
	},
};

/**
 * When `icon` is a function, it will be passed the `size` prop and any other additional props.
 */
export const WithAFunction = Template.bind( {} );
WithAFunction.args = {
	...Default.args,
	icon: ( { size }: { size?: number } ) => (
		<img
			width={ size }
			height={ size }
			src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png"
			alt="WordPress"
		/>
	),
};
WithAFunction.parameters = {
	docs: {
		source: {
			code: `
<Icon
  icon={ ( { size } ) => (
    <img
      width={ size }
      height={ size }
      src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png"
      alt="WordPress"
    />
  ) }
/>
		`,
		},
	},
};

const MyIconComponent = ( { size }: { size?: number } ) => (
	<SVG width={ size } height={ size }>
		<Path d="M5 4v3h5.5v12h3V7H19V4z" />
	</SVG>
);

/**
 * When `icon` is a component, it will be passed the `size` prop and any other additional props.
 */
export const WithAComponent = Template.bind( {} );
WithAComponent.args = {
	...Default.args,
	icon: <MyIconComponent />,
};
WithAComponent.parameters = {
	docs: {
		source: {
			code: `
const MyIconComponent = ( { size } ) => (
  <SVG width={ size } height={ size }>
    <Path d="M5 4v3h5.5v12h3V7H19V4z" />
  </SVG>
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
 * Although it's preferred to use icons from the `@wordpress/icons` package, [Dashicons](https://developer.wordpress.org/resource/dashicons/) are still supported,
 * as long as you are in a context where the Dashicons stylesheet is loaded. To simulate that here,
 * use the Global CSS Injector in the Storybook toolbar at the top and select the "WordPress" preset.
 */
export const WithADashicon: StoryFn< IconProps > = ( args ) => {
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

export const WithAnIconFromTheLibrary: StoryFn< IconProps > = ( args ) => {
	const { additionalProps, ...rest } = args;

	const props = {
		...rest,
		...additionalProps,
		icon: icons[ args.icon as keyof typeof icons ] as IconType,
	};

	return <Icon { ...props } />;
};

WithAnIconFromTheLibrary.args = {
	...Default.args,
	icon: 'wordpress',
	size: 24,
};

WithAnIconFromTheLibrary.argTypes = {
	icon: {
		options: Object.keys( icons ),
		control: 'select',
	},
};
