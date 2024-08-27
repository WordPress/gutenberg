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
	decorators: [
		( Story ) => {
			return (
				<>
					<style>{ `
					  /* These attributes are a private implementation detail of the
						  Navigator component. Do not use outside of its source code. */
						[data-wp-component="NavigatorProvider"] {
							height: calc(100vh - 2rem);
						}
						[data-wp-component="NavigatorScreen"] {
							padding-inline: 8px;
							height: 100%;
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
						<NavigatorButton variant="secondary" path="/child">
							Navigate to child screen.
						</NavigatorButton>

						<NavigatorButton
							variant="secondary"
							path="/overflow-child"
						>
							Navigate to screen with overflowing content
						</NavigatorButton>

						<NavigatorButton variant="secondary" path="/stickies">
							Navigate to screen with sticky content.
						</NavigatorButton>

						<NavigatorButton variant="secondary" path="/product/1">
							Navigate to product screen with id 1.
						</NavigatorButton>

						<NavigatorButton variant="secondary" path="/product/14">
							Navigate to product screen with id 14.
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
					<h2>This is the child screen.</h2>
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
				</NavigatorScreen>

				<NavigatorScreen path="/overflow-child">
					<h2>This is a screen with overflowing content</h2>

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
					<div
						style={ {
							...getStickyStyles( {
								zIndex: 2,
							} ),
							padding: '1rem',
						} }
					>
						<NavigatorBackButton variant="secondary">
							Go back
						</NavigatorBackButton>
					</div>
					<div style={ { padding: '1rem' } }>
						<div
							style={ getStickyStyles( {
								top: 68,
								bgColor: 'peachpuff',
							} ) }
						>
							<h2>A wild sticky element appears</h2>
						</div>
						<MetaphorIpsum quantity={ 3 } />
					</div>
					<div style={ { padding: '1rem' } }>
						<div
							style={ getStickyStyles( {
								top: 68,
								bgColor: 'paleturquoise',
							} ) }
						>
							<h2>Another wild sticky element appears</h2>
						</div>
						<MetaphorIpsum quantity={ 3 } />
					</div>
					<div
						style={ {
							...getStickyStyles( {
								bgColor: 'mistyrose',
							} ),
							padding: '1rem',
						} }
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
			<h2>This is the product details screen</h2>
			<p>The current product id is: { params.id }</p>
			<NavigatorBackButton variant="secondary">
				Go back
			</NavigatorBackButton>
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
					<h2>Home screen</h2>

					<NavigatorButton variant="secondary" path="/child1">
						Go to first child.
					</NavigatorButton>
					<NavigatorButton variant="secondary" path="/child2">
						Go to second child.
					</NavigatorButton>
				</NavigatorScreen>
				<NavigatorScreen path="/child1">
					<h2>First child screen</h2>

					<NavigatorBackButton variant="secondary">
						Go back to parent
					</NavigatorBackButton>
				</NavigatorScreen>
				<NavigatorScreen path="/child2">
					<h2>Second child screen</h2>

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
					<h2>Grand-child screen</h2>

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
						outline: '1px solid black',
						outlineOffset: '-1px',
						marginBlockEnd: '1rem',
					} }
				>
					<NavigatorScreen
						path="/"
						style={ {
							height: '100%',
						} }
					>
						<h2>Home screen</h2>
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

				<NavigatorButtonWithSkipFocus variant="secondary" path="/child">
					Go to child screen, but keep focus on this button
				</NavigatorButtonWithSkipFocus>
			</>
		),
	},
};
