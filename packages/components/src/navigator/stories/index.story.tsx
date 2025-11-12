/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { VStack } from '../../v-stack';
import { HStack } from '../../h-stack';
import { Navigator, useNavigator } from '../';

const meta: Meta< typeof Navigator > = {
	component: Navigator,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Screen: Navigator.Screen,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Button: Navigator.Button,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		BackButton: Navigator.BackButton,
	},
	title: 'Components/Navigation/Navigator',
	id: 'components-navigator',
	argTypes: {
		as: { control: false },
		children: { control: false },
		initialPath: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	decorators: [
		( Story ) => {
			return (
				<>
					<style>{ `
					  /* The data-wp-component attribute is a private implementation
						 * detail of the Navigator component. Do not use outside of
						 * its source code.
						 */
						[data-wp-component="Navigator"] {
							height: 250px;
						}
						[data-wp-component="Navigator.Screen"] {
							padding: 8px;
						}
					` }</style>
					<Story />
				</>
			);
		},
	],
};
export default meta;

export const Default: StoryObj< typeof Navigator > = {
	args: {
		initialPath: '/',
		children: (
			<>
				<Navigator.Screen path="/">
					<h2>This is the home screen.</h2>

					<VStack alignment="left">
						<Navigator.Button variant="primary" path="/child">
							Go to child screen.
						</Navigator.Button>

						<Navigator.Button variant="primary" path="/product/1">
							Go to dynamic path screen with id 1.
						</Navigator.Button>

						<Navigator.Button variant="primary" path="/product/2">
							Go to dynamic path screen with id 2.
						</Navigator.Button>
					</VStack>
				</Navigator.Screen>

				<Navigator.Screen path="/child">
					<h2>This is the child screen.</h2>
					<HStack spacing={ 2 } alignment="left">
						<Navigator.BackButton variant="secondary">
							Go back
						</Navigator.BackButton>

						<Navigator.Button
							variant="primary"
							path="/child/grandchild"
						>
							Go to grand child screen.
						</Navigator.Button>
					</HStack>
				</Navigator.Screen>

				<Navigator.Screen path="/child/grandchild">
					<h2>This is the grand child screen.</h2>
					<Navigator.BackButton variant="secondary">
						Go back
					</Navigator.BackButton>
				</Navigator.Screen>

				<Navigator.Screen path="/product/:id">
					<DynamicScreen />
				</Navigator.Screen>
			</>
		),
	},
};

function DynamicScreen() {
	const { params } = useNavigator();

	return (
		<>
			<h2>This is the dynamic screen</h2>
			<p>
				This screen can parse params dynamically. The current id is:{ ' ' }
				{ params.id }
			</p>
			<Navigator.BackButton variant="secondary">
				Go back
			</Navigator.BackButton>
		</>
	);
}

export const WithNestedInitialPath: StoryObj< typeof Navigator > = {
	...Default,
	args: {
		...Default.args,
		initialPath: '/child/grandchild',
	},
};

const NavigatorButtonWithSkipFocus = ( {
	path,
	onClick,
	...props
}: React.ComponentProps< typeof Navigator.Button > ) => {
	const { goTo } = useNavigator();

	return (
		<Button
			{ ...props }
			style={ {
				marginInline: '8px',
				...props.style,
			} }
			onClick={ ( e: React.MouseEvent< HTMLButtonElement > ) => {
				goTo( path, { skipFocus: true } );
				onClick?.( e );
			} }
		/>
	);
};

export const SkipFocus: StoryObj< typeof Navigator > = {
	args: {
		initialPath: '/',
		children: (
			<>
				<div
					style={ {
						height: 150,
						outline: '1px solid black',
						outlineOffset: '-1px',
						marginBlockEnd: '1rem',
						display: 'contents',
					} }
				>
					<Navigator.Screen path="/">
						<h2>Home screen</h2>
						<Navigator.Button variant="primary" path="/child">
							Go to child screen.
						</Navigator.Button>
					</Navigator.Screen>

					<Navigator.Screen path="/child">
						<h2>Child screen</h2>
						<Navigator.BackButton variant="secondary">
							Go back to home screen
						</Navigator.BackButton>
					</Navigator.Screen>
				</div>

				<NavigatorButtonWithSkipFocus path="/child">
					Go to child screen, but keep focus on this button
				</NavigatorButtonWithSkipFocus>
			</>
		),
	},
};
