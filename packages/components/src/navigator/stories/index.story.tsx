/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardFooter, CardHeader } from '../../card';
import { VStack } from '../../v-stack';
import Dropdown from '../../dropdown';
import { Navigator, useNavigator } from '..';

const meta: Meta< typeof Navigator > = {
	component: Navigator,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Navigator.Screen': Navigator.Screen,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Navigator.Button': Navigator.Button,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Navigator.BackButton': Navigator.BackButton,
	},
	title: 'Components/Navigator',
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: null } },
		initialPath: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Navigator > = ( { style, ...props } ) => (
	<Navigator
		style={ { ...style, height: '100vh', maxHeight: '450px' } }
		{ ...props }
	>
		<Navigator.Screen path="/">
			<Card>
				<CardBody>
					<p>This is the home screen.</p>

					<VStack alignment="left">
						<Navigator.Button variant="secondary" path="/child">
							Navigate to child screen.
						</Navigator.Button>

						<Navigator.Button
							variant="secondary"
							path="/overflow-child"
						>
							Navigate to screen with horizontal overflow.
						</Navigator.Button>

						<Navigator.Button variant="secondary" path="/stickies">
							Navigate to screen with sticky content.
						</Navigator.Button>

						<Navigator.Button variant="secondary" path="/product/1">
							Navigate to product screen with id 1.
						</Navigator.Button>

						<Dropdown
							renderToggle={ ( {
								isOpen,
								onToggle,
							}: {
								// TODO: remove once `Dropdown` is refactored to TypeScript
								isOpen: boolean;
								onToggle: () => void;
							} ) => (
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									variant="primary"
								>
									Open test dialog
								</Button>
							) }
							renderContent={ () => (
								<Card>
									<CardHeader>Go</CardHeader>
									<CardBody>Stuff</CardBody>
								</Card>
							) }
						/>
					</VStack>
				</CardBody>
			</Card>
		</Navigator.Screen>

		<Navigator.Screen path="/child">
			<Card>
				<CardBody>
					<p>This is the child screen.</p>
					<Navigator.BackButton variant="secondary">
						Go back
					</Navigator.BackButton>
				</CardBody>
			</Card>
		</Navigator.Screen>

		<Navigator.Screen path="/overflow-child">
			<Card>
				<CardBody>
					<Navigator.BackButton variant="secondary">
						Go back
					</Navigator.BackButton>
					<div
						style={ {
							display: 'inline-block',
							background: 'papayawhip',
						} }
					>
						<span
							style={ {
								color: 'palevioletred',
								whiteSpace: 'nowrap',
								fontSize: '42vw',
							} }
						>
							¯\_(ツ)_/¯
						</span>
					</div>
				</CardBody>
			</Card>
		</Navigator.Screen>

		<Navigator.Screen path="/stickies">
			<Card>
				<CardHeader style={ getStickyStyles( { zIndex: 2 } ) }>
					<Navigator.BackButton variant="secondary">
						Go back
					</Navigator.BackButton>
				</CardHeader>
				<CardBody>
					<div
						style={ getStickyStyles( {
							top: 69,
							bgColor: 'peachpuff',
						} ) }
					>
						<h2>A wild sticky element appears</h2>
					</div>
					<MetaphorIpsum quantity={ 3 } />
				</CardBody>
				<CardBody>
					<div
						style={ getStickyStyles( {
							top: 69,
							bgColor: 'paleturquoise',
						} ) }
					>
						<h2>Another wild sticky element appears</h2>
					</div>
					<MetaphorIpsum quantity={ 3 } />
				</CardBody>
				<CardFooter
					style={ getStickyStyles( {
						bgColor: 'mistyrose',
					} ) }
				>
					<Button variant="primary">Primary noop</Button>
				</CardFooter>
			</Card>
		</Navigator.Screen>

		<Navigator.Screen path="/product/:id">
			<ProductDetails />
		</Navigator.Screen>
	</Navigator>
);

export const Default: StoryFn< typeof Navigator > = Template.bind( {} );
Default.args = {
	initialPath: '/',
};

function getStickyStyles( {
	bottom = 0,
	bgColor = 'whitesmoke',
	top = 0,
	zIndex = 1,
} ): React.CSSProperties {
	return {
		display: 'flex',
		position: 'sticky',
		top,
		bottom,
		zIndex,
		backgroundColor: bgColor,
	};
}

function MetaphorIpsum( { quantity }: { quantity: number } ) {
	const list = [
		'A loopy clarinet’s year comes with it the thought that the fenny step-son is an ophthalmologist. The literature would have us believe that a glabrate country is not but a rhythm. A beech is a rub from the right perspective. In ancient times few can name an unglossed walrus that isn’t an unspilt trial.',
		'Authors often misinterpret the afterthought as a roseless mother-in-law, when in actuality it feels more like an uncapped thunderstorm. In recent years, some posit the tarry bottle to be less than acerb. They were lost without the unkissed timbale that composed their customer. A donna is a springtime breath.',
		'It’s an undeniable fact, really; their museum was, in this moment, a snotty beef. The swordfishes could be said to resemble prowessed lasagnas. However, the rainier authority comes from a cureless soup. Unfortunately, that is wrong; on the contrary, the cover is a powder.',
	];
	quantity = Math.min( list.length, quantity );
	return (
		<>
			{ list.slice( 0, quantity ).map( ( text, key ) => (
				<p style={ { maxWidth: '20em' } } key={ key }>
					{ text }
				</p>
			) ) }
		</>
	);
}

function ProductDetails() {
	const { params } = useNavigator();

	return (
		<Card>
			<CardBody>
				<Navigator.BackButton variant="secondary">
					Go back
				</Navigator.BackButton>
				<p>This is the screen for the product with id: { params.id }</p>
			</CardBody>
		</Card>
	);
}

const NestedNavigatorTemplate: StoryFn< typeof Navigator > = ( {
	style,
	...props
} ) => (
	<Navigator
		style={ { ...style, height: '100vh', maxHeight: '450px' } }
		{ ...props }
	>
		<Navigator.Screen path="/">
			<Card>
				<CardBody>
					<Navigator.Button variant="secondary" path="/child1">
						Go to first child.
					</Navigator.Button>
					<Navigator.Button variant="secondary" path="/child2">
						Go to second child.
					</Navigator.Button>
				</CardBody>
			</Card>
		</Navigator.Screen>
		<Navigator.Screen path="/child1">
			<Card>
				<CardBody>
					This is the first child
					<Navigator.ToParentButton variant="secondary">
						Go back to parent
					</Navigator.ToParentButton>
				</CardBody>
			</Card>
		</Navigator.Screen>
		<Navigator.Screen path="/child2">
			<Card>
				<CardBody>
					This is the second child
					<Navigator.ToParentButton variant="secondary">
						Go back to parent
					</Navigator.ToParentButton>
					<Navigator.Button
						variant="secondary"
						path="/child2/grandchild"
					>
						Go to grand child.
					</Navigator.Button>
				</CardBody>
			</Card>
		</Navigator.Screen>
		<Navigator.Screen path="/child2/grandchild">
			<Card>
				<CardBody>
					This is the grand child
					<Navigator.ToParentButton variant="secondary">
						Go back to parent
					</Navigator.ToParentButton>
				</CardBody>
			</Card>
		</Navigator.Screen>
	</Navigator>
);

export const NestedNavigator: StoryFn< typeof Navigator > =
	NestedNavigatorTemplate.bind( {} );
NestedNavigator.args = {
	initialPath: '/child2/grandchild',
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
			onClick={ ( e: React.MouseEvent< HTMLButtonElement > ) => {
				goTo( path, { skipFocus: true } );
				onClick?.( e );
			} }
		/>
	);
};

export const SkipFocus: StoryFn< typeof Navigator > = ( args ) => {
	return <Navigator { ...args } />;
};
SkipFocus.args = {
	initialPath: '/',
	children: (
		<>
			<div
				style={ {
					height: 250,
					border: '1px solid black',
				} }
			>
				<Navigator.Screen
					path="/"
					style={ {
						height: '100%',
					} }
				>
					<h1>Home screen</h1>
					<Navigator.Button variant="secondary" path="/child">
						Go to child screen.
					</Navigator.Button>
				</Navigator.Screen>
				<Navigator.Screen
					path="/child"
					style={ {
						height: '100%',
					} }
				>
					<h2>Child screen</h2>
					<Navigator.ToParentButton variant="secondary">
						Go to parent screen.
					</Navigator.ToParentButton>
				</Navigator.Screen>
			</div>

			<NavigatorButtonWithSkipFocus
				variant="secondary"
				path="/child"
				style={ { margin: '1rem 2rem' } }
			>
				Go to child screen, but keep focus on this button
			</NavigatorButtonWithSkipFocus>
		</>
	),
};
