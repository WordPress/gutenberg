/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { VStack } from '../../v-stack';
import Dropdown from '../../dropdown';
import MenuItem from '../../menu-item';
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
	useNavigator,
} from '..';

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
};
export default meta;

export const Default: StoryObj< typeof NavigatorProvider > = {
	args: {
		initialPath: '/',
		style: { height: '100vh', maxHeight: '450px' },
		children: (
			<>
				<NavigatorScreen path="/">
					<p>This is the home screen.</p>

					<VStack alignment="left">
						<NavigatorButton variant="secondary" path="/child">
							Navigate to child screen.
						</NavigatorButton>

						<NavigatorButton
							variant="secondary"
							path="/overflow-child"
						>
							Navigate to screen with horizontal overflow.
						</NavigatorButton>

						<NavigatorButton variant="secondary" path="/stickies">
							Navigate to screen with sticky content.
						</NavigatorButton>

						<NavigatorButton variant="secondary" path="/product/1">
							Navigate to product screen with id 1.
						</NavigatorButton>

						<Dropdown
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									variant="primary"
								>
									Open test dialog
								</Button>
							) }
							renderContent={ () => (
								<>
									<MenuItem>Item 2</MenuItem>
									<MenuItem>Item 1</MenuItem>
								</>
							) }
						/>
					</VStack>
				</NavigatorScreen>

				<NavigatorScreen path="/child">
					<p>This is the child screen.</p>
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
				</NavigatorScreen>

				<NavigatorScreen path="/overflow-child">
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
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
				</NavigatorScreen>

				<NavigatorScreen path="/stickies">
					<div style={ getStickyStyles( { zIndex: 2 } ) }>
						<NavigatorBackButton variant="secondary">
							Go back
						</NavigatorBackButton>
					</div>
					<div>
						<div
							style={ getStickyStyles( {
								top: 69,
								bgColor: 'peachpuff',
							} ) }
						>
							<h2>A wild sticky element appears</h2>
						</div>
					</div>
					<div>
						<MetaphorIpsum quantity={ 3 } />
						<div
							style={ getStickyStyles( {
								top: 69,
								bgColor: 'paleturquoise',
							} ) }
						>
							<h2>Another wild sticky element appears</h2>
						</div>
						<MetaphorIpsum quantity={ 3 } />
					</div>
					<div
						style={ getStickyStyles( {
							bgColor: 'mistyrose',
						} ) }
					>
						<Button variant="primary">Primary noop</Button>
					</div>
				</NavigatorScreen>

				<NavigatorScreen path="/product/:id">
					<ProductDetails />
				</NavigatorScreen>
			</>
		),
	},
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
		<div>
			<NavigatorBackButton variant="secondary">
				Go back
			</NavigatorBackButton>
			<p>This is the screen for the product with id: { params.id }</p>
		</div>
	);
}

export const NestedNavigator: StoryObj< typeof NavigatorProvider > = {
	...Default,
	args: {
		...Default.args,
		initialPath: '/child2/grandchild',
		children: (
			<>
				<NavigatorScreen path="/">
					<NavigatorButton variant="secondary" path="/child1">
						Go to first child.
					</NavigatorButton>
					<NavigatorButton variant="secondary" path="/child2">
						Go to second child.
					</NavigatorButton>
				</NavigatorScreen>
				<NavigatorScreen path="/child1">
					This is the first child
					<NavigatorBackButton variant="secondary">
						Go back to parent
					</NavigatorBackButton>
				</NavigatorScreen>
				<NavigatorScreen path="/child2">
					This is the second child
					<NavigatorBackButton variant="secondary">
						Go back to parent
					</NavigatorBackButton>
					<NavigatorButton
						variant="secondary"
						path="/child2/grandchild"
					>
						Go to grand child.
					</NavigatorButton>
				</NavigatorScreen>
				<NavigatorScreen path="/child2/grandchild">
					This is the grand child
					<NavigatorBackButton variant="secondary">
						Go back to parent
					</NavigatorBackButton>
				</NavigatorScreen>
			</>
		),
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
						height: 250,
						border: '1px solid black',
					} }
				>
					<NavigatorScreen
						path="/"
						style={ {
							height: '100%',
						} }
					>
						<h1>Home screen</h1>
						<NavigatorButton variant="secondary" path="/child">
							Go to child screen.
						</NavigatorButton>
					</NavigatorScreen>
					<NavigatorScreen
						path="/child"
						style={ {
							height: '100%',
						} }
					>
						<h2>Child screen</h2>
						<NavigatorBackButton variant="secondary">
							Go to parent screen.
						</NavigatorBackButton>
					</NavigatorScreen>
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
	},
};
