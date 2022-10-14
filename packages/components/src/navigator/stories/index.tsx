/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import { css } from '@emotion/react';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardFooter, CardHeader } from '../../card';
import { HStack } from '../../h-stack';
import Dropdown from '../../dropdown';
import { useCx } from '../../utils/hooks/use-cx';
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
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof NavigatorProvider > = ( {
	className,
	...props
} ) => {
	const cx = useCx();
	return (
		<NavigatorProvider
			className={ cx(
				css( `height: 100vh; max-height: 450px;` ),
				className
			) }
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

							<NavigatorButton
								variant="secondary"
								path="/stickies"
							>
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
							className={ cx(
								css( `
									display: inline-block;
									background: papayawhip;
								` )
							) }
						>
							<span
								className={ cx(
									css( `
										color: palevioletred;
										white-space: nowrap;
										font-size: 42vw;
									` )
								) }
							>
								¯\_(ツ)_/¯
							</span>
						</div>
					</CardBody>
				</Card>
			</NavigatorScreen>

			<NavigatorScreen path="/stickies">
				<Card>
					<Sticky as={ CardHeader } z={ 2 }>
						<NavigatorBackButton variant="secondary">
							Go back
						</NavigatorBackButton>
					</Sticky>
					<CardBody>
						<Sticky top={ 69 } colors="papayawhip/peachpuff">
							<h2>A wild sticky element appears</h2>
						</Sticky>
						<MetaphorIpsum quantity={ 3 } />
					</CardBody>
					<CardBody>
						<Sticky top={ 69 } colors="azure/paleturquoise">
							<h2>Another wild sticky element appears</h2>
						</Sticky>
						<MetaphorIpsum quantity={ 3 } />
					</CardBody>
					<Sticky as={ CardFooter } colors="mistyrose/pink">
						<Button variant="primary">Primary noop</Button>
					</Sticky>
				</Card>
			</NavigatorScreen>
		</NavigatorProvider>
	);
};

export const Default: ComponentStory< typeof NavigatorProvider > =
	Template.bind( {} );
Default.args = {
	initialPath: '/',
};

type StickyProps = {
	as?: React.ElementType;
	bottom?: number;
	children: ReactNode;
	className?: string;
	colors?: string;
	top?: number;
	z?: number;
};
function Sticky( {
	as: Tag = 'div',
	bottom = 0,
	children,
	className,
	colors = 'whitesmoke/lightgrey',
	top = 0,
	z: zIndex = 1,
}: StickyProps ) {
	const cx = useCx();
	const [ bgColor, dotColor ] = colors.split( '/' );
	const classes = cx(
		css( {
			top,
			bottom,
			zIndex,
			display: 'flex',
			position: 'sticky',
			background: `radial-gradient(${ dotColor } 1px, ${ bgColor } 2px) 50%/1em 1em`,
		} ),
		className
	);
	return <Tag className={ classes }>{ children }</Tag>;
}

function MetaphorIpsum( { quantity }: { quantity: number } ) {
	const cx = useCx();
	const list = [
		'A loopy clarinet’s year comes with it the thought that the fenny step-son is an ophthalmologist. The literature would have us believe that a glabrate country is not but a rhythm. A beech is a rub from the right perspective. In ancient times few can name an unglossed walrus that isn’t an unspilt trial.',
		'Authors often misinterpret the afterthought as a roseless mother-in-law, when in actuality it feels more like an uncapped thunderstorm. In recent years, some posit the tarry bottle to be less than acerb. They were lost without the unkissed timbale that composed their customer. A donna is a springtime breath.',
		'It’s an undeniable fact, really; their museum was, in this moment, a snotty beef. The swordfishes could be said to resemble prowessed lasagnas. However, the rainier authority comes from a cureless soup. Unfortunately, that is wrong; on the contrary, the cover is a powder.',
	];
	quantity = Math.min( list.length, quantity );
	return (
		<>
			{ list.slice( 0, quantity ).map( ( text, key ) => (
				<p className={ cx( css( `max-width: 20em;` ) ) } key={ key }>
					{ text }
				</p>
			) ) }
		</>
	);
}
