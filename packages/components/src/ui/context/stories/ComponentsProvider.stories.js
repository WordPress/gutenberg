/**
 * WordPress dependencies
 */
import { createContext, useContext, memo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Card, CardBody } from '../../';
import { View } from '../../../view';
import { Text } from '../../../text';
import { ContextSystemProvider } from '../index';

const SomeContext = createContext();
const useSomeContext = () => useContext( SomeContext );

export default {
	component: ContextSystemProvider,
	title: 'G2 Components (Experimental)/ContextSystemProvider',
};

const innerContext = {
	Card: {
		css: {
			background: 'white',
		},
	},
};

const InnerContent = memo( () => {
	const state = useSomeContext();
	const isEven = state % 2 === 0;
	return (
		<View css={ { background: isEven ? 'red' : 'initial' } }>
			{ state }
		</View>
	);
} );

const InnerCard = memo( () => {
	return (
		<View style={ { padding: 40 } }>
			<Card>
				<CardBody style={ { border: '3px solid green' } }>
					<InnerContent />
				</CardBody>
			</Card>
		</View>
	);
} );

export const Default = () => {
	const [ state, update ] = useState( 0 );
	const forceUpdate = () => update( ( prev ) => prev + 1 );

	const value = {
		Card: {
			isRounded: false,
			elevation: 100,
		},
		CardBody: {
			as: 'a',
			href: 'https://wordpress.org',
		},
	};

	return (
		<>
			<SomeContext.Provider value={ state }>
				<button onClick={ forceUpdate }>Force Update</button>
				<ContextSystemProvider value={ value }>
					<Card>
						<CardBody>
							<Text optimizeReadabilityFor="blue">Card</Text>
							<ContextSystemProvider value={ innerContext }>
								<InnerCard />
							</ContextSystemProvider>
						</CardBody>
					</Card>
				</ContextSystemProvider>
				<Card>
					<CardBody>
						<Text>Card</Text>
					</CardBody>
				</Card>
			</SomeContext.Provider>
		</>
	);
};
