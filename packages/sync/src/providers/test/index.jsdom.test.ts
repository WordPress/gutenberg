import { afterEach, describe, expect, it, jest } from '@jest/globals';
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
		delete window.__experimentalEnableRealTimeCollaboration;
		jest.dontMock( '@wordpress/hooks' );
		jest.dontMock( '../http-polling/http-polling-provider' );
		jest.resetModules();
	} );

	it( 'does not provide HTTP polling by default', () => {
		const { module, createHttpPollingProvider } = loadProviders();

		expect( module.getDefaultProviderCreators() ).toEqual( [] );
		expect( createHttpPollingProvider ).not.toHaveBeenCalled();
	} );

	it( 'provides HTTP polling when collaboration is enabled', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const {
			module,
			applyFilters,
			createHttpPollingProvider,
			pollingProvider,
		} = loadProviders();

		expect( module.getProviderCreators() ).toEqual( [ pollingProvider ] );
		expect( createHttpPollingProvider ).toHaveBeenCalledTimes( 1 );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [
			pollingProvider,
		] );
	} );

	it( 'allows filters to replace the polling provider', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const customProvider = createMockProviderCreator();
		const { module, applyFilters, pollingProvider } = loadProviders( () => [
			customProvider,
		] );

		expect( module.getProviderCreators() ).toEqual( [ customProvider ] );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [
			pollingProvider,
		] );
	} );
} );
