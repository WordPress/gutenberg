/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	registerImageEditorExtensionPanel,
	useImageEditorExtensionPanels,
} from '..';

describe( 'image editor extension panel registry', () => {
	const unregisterCallbacks: Array< () => void > = [];

	afterEach( () => {
		act( () => {
			while ( unregisterCallbacks.length ) {
				unregisterCallbacks.pop()?.();
			}
		} );
	} );

	function register(
		...args: Parameters< typeof registerImageEditorExtensionPanel >
	) {
		const unregister = registerImageEditorExtensionPanel( ...args );
		unregisterCallbacks.push( unregister );
		return unregister;
	}

	it( 'returns registered panels in deterministic order', () => {
		const { result } = renderHook( () => useImageEditorExtensionPanels() );

		act( () => {
			register( {
				name: 'vendor/filter',
				title: 'Filter',
				order: 20,
				component: () => null,
			} );
			register( {
				name: 'vendor/enhance',
				title: 'Enhance',
				order: 10,
				component: () => null,
			} );
		} );

		expect( result.current.map( ( panel ) => panel.name ) ).toEqual( [
			'vendor/enhance',
			'vendor/filter',
		] );
	} );

	it( 'updates subscribers when a panel unregisters', () => {
		const { result } = renderHook( () => useImageEditorExtensionPanels() );

		let unregister = () => {};
		act( () => {
			unregister = register( {
				name: 'vendor/enhance',
				title: 'Enhance',
				component: () => null,
			} );
		} );

		expect( result.current ).toHaveLength( 1 );

		act( () => {
			unregister();
		} );

		expect( result.current ).toHaveLength( 0 );
	} );

	it( 'rejects duplicate panel names', () => {
		act( () => {
			register( {
				name: 'vendor/enhance',
				title: 'Enhance',
				component: () => null,
			} );
		} );

		expect( () =>
			registerImageEditorExtensionPanel( {
				name: 'vendor/enhance',
				title: 'Enhance again',
				component: () => null,
			} )
		).toThrow(
			'Image editor extension panel "vendor/enhance" is already registered.'
		);
	} );
} );
