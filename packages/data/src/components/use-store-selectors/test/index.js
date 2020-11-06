/**
 * Internal dependencies
 */
import { createRegistry } from '../../../registry';
import useStoreSelectors from '../index';

/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';
/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

describe( 'useStoreSelectors', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'wraps useSelect', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		const TestComponent = () => {
			const results = useStoreSelectors(
				'testStore',
				( { testSelector } ) => testSelector( 'foo' )
			);
			return <div>{ results }</div>;
		};

		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent keyName="foo" />
				</RegistryProvider>
			);
		} );
		const testInstance = renderer.root;
		// ensure expected state was rendered
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'bar',
		} );
	} );
} );
