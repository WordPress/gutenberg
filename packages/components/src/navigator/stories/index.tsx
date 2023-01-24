/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardFooter, CardHeader } from '../../card';
import { HStack } from '../../h-stack';
import Dropdown from '../../dropdown';
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
} from '..';

const meta: ComponentMeta< typeof NavigatorProvider > = {
	component: NavigatorProvider,
	title: 'Components (Experimental)/Navigator',
	subcomponents: { NavigatorScreen, NavigatorButton, NavigatorBackButton },
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: null } },
		initialPath: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof NavigatorProvider > = ( {
	style,
	...props
} ) => (
	<NavigatorProvider
		style={ { ...style, height: '100vh', maxHeight: '450px' } }
		{ ...props }
	>
		<NavigatorScreen path="/">
			<Card>
				<CardBody>
					<p>This is the home screen.</p>

					<HStack justify="flex-start" wrap>
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
					</HStack>
				</CardBody>
			</Card>
		</NavigatorScreen>

		<NavigatorScreen path="/child">
			<Card>
				<CardBody>
					<p>This is the child screen.</p>
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
				</CardBody>
			</Card>
		</NavigatorScreen>

		<NavigatorScreen path="/overflow-child">
			<Card>
				<CardBody>
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
				</CardBody>
			</Card>
		</NavigatorScreen>

		<NavigatorScreen path="/stickies">
			<Card>
				<CardHeader style={ getStickyStyles( { zIndex: 2 } ) }>
					<NavigatorBackButton variant="secondary">
						Go back
					</NavigatorBackButton>
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
		</NavigatorScreen>
	</NavigatorProvider>
);

export const Default: ComponentStory< typeof NavigatorProvider > =
	Template.bind( {} );
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
