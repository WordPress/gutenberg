/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardFooter, CardHeader } from '../../card';
import { HStack } from '../../h-stack';
import { Flyout } from '../../flyout';
import { useCx } from '../../utils/hooks/use-cx';
import { NavigatorProvider, NavigatorScreen, useNavigator } from '../';

export default {
	title: 'Components (Experimental)/Navigator',
	component: NavigatorProvider,
};

function NavigatorButton( { path, ...props } ) {
	const { goTo } = useNavigator();
	const dataAttrName = 'data-navigator-focusable-id';
	const dataAttrValue = path;

	const dataAttrCssSelector = `[${ dataAttrName }="${ dataAttrValue }"]`;

	const buttonProps = {
		...props,
		[ dataAttrName ]: dataAttrValue,
	};

	return (
		<Button
			variant="secondary"
			onClick={ () =>
				goTo( path, { focusTargetSelector: dataAttrCssSelector } )
			}
			{ ...buttonProps }
		/>
	);
}

function NavigatorBackButton( props ) {
	const { goBack } = useNavigator();
	return (
		<Button variant="secondary" onClick={ () => goBack() } { ...props } />
	);
}

const MyNavigation = () => {
	const cx = useCx();
	return (
		<NavigatorProvider
			initialPath="/"
			className={ cx( css( `height: 100vh; max-height: 450px;` ) ) }
		>
			<NavigatorScreen path="/">
				<Card>
					<CardBody>
						<p>This is the home screen.</p>

						<HStack justify="flex-start" wrap>
							<NavigatorButton path="/child">
								Navigate to child screen.
							</NavigatorButton>

							<NavigatorButton path="/overflow-child">
								Navigate to screen with horizontal overflow.
							</NavigatorButton>

							<NavigatorButton path="/stickies">
								Navigate to screen with sticky content.
							</NavigatorButton>

							<Flyout
								trigger={
									<Button variant="primary">
										Open test dialog
									</Button>
								}
								placement="bottom-start"
							>
								<CardHeader>Go</CardHeader>
								<CardBody>Stuff</CardBody>
							</Flyout>
						</HStack>
					</CardBody>
				</Card>
			</NavigatorScreen>

			<NavigatorScreen path="/child">
				<Card>
					<CardBody>
						<p>This is the child screen.</p>
						<NavigatorBackButton>Go back</NavigatorBackButton>
					</CardBody>
				</Card>
			</NavigatorScreen>

			<NavigatorScreen path="/overflow-child">
				<Card>
					<CardBody>
						<NavigatorBackButton>Go back</NavigatorBackButton>
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
					<Sticky as={ CardHeader } z="2">
						<NavigatorBackButton>Go back</NavigatorBackButton>
					</Sticky>
					<CardBody>
						<Sticky top="69px" colors="papayawhip/peachpuff">
							<h2>A wild sticky element appears</h2>
						</Sticky>
						<MetaphorIpsum quantity={ 3 } />
					</CardBody>
					<CardBody>
						<Sticky top="69px" colors="azure/paleturquoise">
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

export const _default = () => {
	return <MyNavigation />;
};

function Sticky( {
	as: Tag = 'div',
	bottom = 0,
	colors = 'whitesmoke/lightgrey',
	top = 0,
	z: zIndex = 1,
	...props
} ) {
	const cx = useCx();
	const [ bgColor, dotColor ] = colors.split( '/' );
	const className = cx(
		css( {
			top,
			bottom,
			zIndex,
			display: 'flex',
			position: 'sticky',
			background: `radial-gradient(${ dotColor } 1px, ${ bgColor } 2px) 50%/1em 1em`,
		} ),
		props.className
	);
	const propsOut = { ...props, className };
	return <Tag { ...propsOut } />;
}

function MetaphorIpsum( { quantity } ) {
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
