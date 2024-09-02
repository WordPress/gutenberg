/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { VStack } from '../../v-stack';
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
	useNavigator,
} from '..';
import { HStack } from '../../h-stack';

const meta: Meta< typeof NavigatorProvider > = {
	component: NavigatorProvider,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { NavigatorScreen, NavigatorButton, NavigatorBackButton },
	title: 'Components (Experimental)/Navigator',
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: null } },
		initialPath: { control: { type: null } },
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
					  /* These attributes are a private implementation detail of the
						  Navigator component. Do not use outside of its source code. */
						[data-wp-component="NavigatorProvider"] {
							height: calc(100vh - 2rem);
							max-height: 250px;

						}
						[data-wp-component="NavigatorScreen"]:not([data-sticky]) {
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

export const Default: StoryObj< typeof NavigatorProvider > = {
	args: {
		initialPath: '/',
		children: (
			<>
				<NavigatorScreen path="/">
					<h2>This is the home screen.</h2>

					<VStack alignment="left">
						<NavigatorButton variant="primary" path="/child">
							Go to child screen.
						</NavigatorButton>

						<NavigatorButton variant="primary" path="/product/1">
							Go to dynamic path screen with id 1.
						</NavigatorButton>

						<NavigatorButton variant="primary" path="/product/2">
							Go to dynamic path screen with id 2.
						</NavigatorButton>
					</VStack>
				</NavigatorScreen>

				<NavigatorScreen path="/child">
					<h2>This is the child screen.</h2>
					<HStack spacing={ 2 } alignment="left">
						<NavigatorBackButton variant="secondary">
							Go back
						</NavigatorBackButton>

						<NavigatorButton
							variant="primary"
							path="/child/grandchild"
						>
							Go to grand child screen.
						</NavigatorButton>
					</HStack>
				</NavigatorScreen>

				<NavigatorScreen path="/child/grandchild">
					<h2>This is the grand child screen.</h2>
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
				</NavigatorScreen>

				<NavigatorScreen path="/product/:id">
					<DynamicScreen />
				</NavigatorScreen>
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
			<NavigatorBackButton variant="secondary">
				Go back
			</NavigatorBackButton>
		</>
	);
}

export const WithNestedInitialPath: StoryObj< typeof NavigatorProvider > = {
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
}: React.ComponentProps< typeof NavigatorButton > ) => {
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

export const SkipFocus: StoryObj< typeof NavigatorProvider > = {
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
					} }
				>
					<NavigatorScreen path="/">
						<h2>Home screen</h2>
						<NavigatorButton variant="primary" path="/child">
							Go to child screen.
						</NavigatorButton>
					</NavigatorScreen>

					<NavigatorScreen path="/child">
						<h2>Child screen</h2>
						<NavigatorBackButton variant="secondary">
							Go back to home screen
						</NavigatorBackButton>
					</NavigatorScreen>
				</div>

				<NavigatorButtonWithSkipFocus path="/child">
					Go to child screen, but keep focus on this button
				</NavigatorButtonWithSkipFocus>
			</>
		),
	},
};
