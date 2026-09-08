import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProviderCreator } from '../../types';

type ProvidersModule = typeof import('../index');
type ApplyFilters = ( hookName: string, defaultValue: unknown ) => unknown;

function createMockProviderCreator(): ProviderCreator {
	return async () => ( {
		destroy: vi.fn(),
		on: vi.fn(),
	} );
}

async function loadProviders(
	filter: ( providers: ProviderCreator[] ) => unknown = ( providers ) =>
		providers
) {
	vi.resetModules();

	const applyFilters = vi.fn< ApplyFilters >(
		( _hookName: string, defaultValue: unknown ) =>
			filter( defaultValue as ProviderCreator[] )
	);
	const pollingProvider = createMockProviderCreator();
	const createHttpPollingProvider = vi.fn( () => pollingProvider );

	vi.doMock( '@wordpress/hooks', () => ( { applyFilters } ) );
	vi.doMock( '../http-polling/http-polling-provider', () => ( {
		createHttpPollingProvider,
	} ) );

	return {
		module: ( await import( '../index' ) ) as ProvidersModule,
		applyFilters,
		createHttpPollingProvider,
		pollingProvider,
	};
}

describe( 'sync providers', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		vi.doUnmock( '@wordpress/hooks' );
		vi.doUnmock( '../http-polling/http-polling-provider' );
		vi.resetModules();
	} );

	it( 'does not provide HTTP polling by default', async () => {
		const { module, createHttpPollingProvider } = await loadProviders();

		expect( module.getDefaultProviderCreators() ).toEqual( [] );
		expect( createHttpPollingProvider ).not.toHaveBeenCalled();
	} );

	it( 'provides HTTP polling when collaboration is enabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const {
			module,
			applyFilters,
			createHttpPollingProvider,
			pollingProvider,
		} = await loadProviders();

		expect( module.getProviderCreators() ).toEqual( [ pollingProvider ] );
		expect( createHttpPollingProvider ).toHaveBeenCalledTimes( 1 );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [
			pollingProvider,
		] );
	} );

	it( 'allows filters to replace the polling provider', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const customProvider = createMockProviderCreator();
		const { module, applyFilters, pollingProvider } = await loadProviders(
			() => [ customProvider ]
		);

		expect( module.getProviderCreators() ).toEqual( [ customProvider ] );
		expect( applyFilters ).toHaveBeenCalledWith( 'sync.providers', [
			pollingProvider,
		] );
	} );
} );
