/**
 * External dependencies
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * Internal dependencies
 */
import type { ProviderCreator } from '../../types';

type ProvidersModule = typeof import('../index');
type ApplyFilters = ( hookName: string, defaultValue: unknown ) => unknown;

function createMockProviderCreator(): ProviderCreator {
	return async () => ( {
		destroy: jest.fn(),
		on: jest.fn(),
	} );
}

function loadProviders(
	filter: ( providers: ProviderCreator[] ) => unknown = ( providers ) =>
		providers
): {
	module: ProvidersModule;
	applyFilters: jest.MockedFunction< ApplyFilters >;
	createHttpPollingProvider: jest.MockedFunction< () => ProviderCreator >;
	pollingProvider: ProviderCreator;
} {
	jest.resetModules();

	const applyFilters = jest.fn(
		( _hookName: string, defaultValue: unknown ) =>
			filter( defaultValue as ProviderCreator[] )
	);
	const pollingProvider = createMockProviderCreator();
	const createHttpPollingProvider = jest.fn( () => pollingProvider );

	jest.doMock( '@wordpress/hooks', () => ( { applyFilters } ) );
	jest.doMock( '../http-polling/http-polling-provider', () => ( {
		createHttpPollingProvider,
	} ) );

	return {
		module: require( '../index' ) as ProvidersModule,
		applyFilters,
		createHttpPollingProvider,
		pollingProvider,
	};
}

describe( 'sync providers', () => {
	afterEach( () => {
		delete window._wpCollaborationEnabled;
		delete window.experimentalPollingProvider;
		jest.dontMock( '@wordpress/hooks' );
		jest.dontMock( '../http-polling/http-polling-provider' );
		jest.resetModules();
	} );

	it( 'does not provide HTTP polling by default', () => {
		const { module, createHttpPollingProvider } = loadProviders();

		expect( module.getDefaultProviderCreators() ).toEqual( [] );
		expect( module.hasProviderCreators() ).toBe( false );
		expect( createHttpPollingProvider ).not.toHaveBeenCalled();
	} );

	it( 'reports no providers when collaboration is enabled without polling', () => {
		window._wpCollaborationEnabled = true;
		const { module, applyFilters } = loadProviders();

		expect( module.hasProviderCreators() ).toBe( false );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [] );
	} );

	it( 'provides HTTP polling when its experiment is enabled', () => {
		window._wpCollaborationEnabled = true;
		window.experimentalPollingProvider = true;
		const {
			module,
			applyFilters,
			createHttpPollingProvider,
			pollingProvider,
		} = loadProviders();

		expect( module.hasProviderCreators() ).toBe( true );
		expect( module.getProviderCreators() ).toEqual( [ pollingProvider ] );
		expect( createHttpPollingProvider ).toHaveBeenCalledTimes( 1 );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [
			pollingProvider,
		] );
	} );

	it( 'allows filters to add a provider when polling is disabled', () => {
		window._wpCollaborationEnabled = true;
		const customProvider = createMockProviderCreator();
		const { module, applyFilters } = loadProviders( ( providers ) => [
			...providers,
			customProvider,
		] );

		expect( module.hasProviderCreators() ).toBe( true );
		expect( module.getProviderCreators() ).toEqual( [ customProvider ] );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [] );
	} );
} );
