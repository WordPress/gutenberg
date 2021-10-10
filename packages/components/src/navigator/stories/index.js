/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardFooter, CardHeader } from '../../card';
import { HStack } from '../../h-stack';
import { Flyout } from '../../flyout';
import { NavigatorProvider, NavigatorScreen, useNavigator } from '../';

export default {
	title: 'Components (Experimental)/Navigator',
	component: NavigatorProvider,
};

function NavigatorButton( { path, isBack = false, ...props } ) {
	const navigator = useNavigator();
	return (
		<Button
			onClick={ () => navigator.push( path, { isBack } ) }
			{ ...props }
		/>
	);
}

const MyNavigation = () => (
	<NavigatorProvider
		initialPath="/"
		style={ { height: '100vh', maxHeight: '450px' } }
	>
		<NavigatorScreen path="/">
			<Card>
				<CardBody>
					<p>This is the home screen.</p>

					<HStack justify="flex-start" wrap>
						<NavigatorButton variant="primary" path="/child">
							Navigate to child screen.
						</NavigatorButton>

						<NavigatorButton path="/overflow-child">
							Navigate to screen with horizontal overflow.
						</NavigatorButton>

						<NavigatorButton path="/stickies">
							Navigate to screen with sticky content.
						</NavigatorButton>

						<Flyout
							trigger={ <Button>Open test dialog</Button> }
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
					<NavigatorButton path="/" isBack>
						Go back
					</NavigatorButton>
				</CardBody>
			</Card>
		</NavigatorScreen>

		<NavigatorScreen path="/overflow-child">
			<Card>
				<CardBody>
					<NavigatorButton path="/" isBack>
						Go back
					</NavigatorButton>
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
				<Sticky as={ CardHeader } z="2">
					<NavigatorButton path="/" isBack>
						Go back
					</NavigatorButton>
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

export const _default = () => {
	return <MyNavigation />;
};

function Sticky( {
	as: Tag = 'div',
	bottom = 0,
	colors = 'whitesmoke/lightgrey',
	style,
	top = 0,
	z: zIndex = 1,
	...props
} ) {
	const [ bgColor, dotColor ] = colors.split( '/' );
	const strictStyle = {
		top,
		bottom,
		zIndex,
		display: 'flex',
		position: 'sticky',
		background: `radial-gradient(${ dotColor } 1px, ${ bgColor } 2px) 50%/1em 1em`,
		textAlign: 'center',
	};
	const propsOut = { ...props, style: { ...style, ...strictStyle } };
	return <Tag { ...propsOut } />;
}

function MetaphorIpsum( { quantity } ) {
	const list = [
		'A pan of the particle is assumed to be an untorn trout. We can assume that any instance of a lawyer can be construed as a peevish page. A dietician is a plushest pamphlet. The testy aunt comes from an ebon halibut.',
		'A dish is the basement of a romania. If this was somewhat unclear, their picture was, in this moment, a rustred sink. A precipitation is a bridgeless need. Before begonias, aprils were only snowflakes.',
		'Those toes are nothing more than violets. A blithesome map without ghanas is truly a equinox of sicklied squirrels. Those acknowledgments are nothing more than brians. Their salad was, in this moment, a steadfast step-grandmother.',
		'However, a profit can hardly be considered a doughy subway without also being a maid. They were lost without the pictured melody that composed their cheese. The halibut of a betty becomes a model care. A match is a sunlike owner.',
		'A loopy clarinet’s year comes with it the thought that the fenny step-son is an ophthalmologist. The literature would have us believe that a glabrate country is not but a rhythm. A beech is a rub from the right perspective. In ancient times few can name an unglossed walrus that isn’t an unspilt trial.',
		'Authors often misinterpret the afterthought as a roseless mother-in-law, when in actuality it feels more like an uncapped thunderstorm. In recent years, some posit the tarry bottle to be less than acerb. They were lost without the unkissed timbale that composed their customer. A donna is a springtime breath.',
		'It’s an undeniable fact, really; their museum was, in this moment, a snotty beef. The swordfishes could be said to resemble prowessed lasagnas. However, the rainier authority comes from a cureless soup. Unfortunately, that is wrong; on the contrary, the cover is a powder.',
	];
	// Shuffle the list
	for ( let i = list.length - 1; i > 0; i-- ) {
		// eslint-disable-next-line no-restricted-syntax
		const randomIndex = Math.floor( Math.random() * ( i + 1 ) );
		[ list[ i ], list[ randomIndex ] ] = [ list[ randomIndex ], list[ i ] ];
	}
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
