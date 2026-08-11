import { createElement } from '@wordpress/element';
import {
	registerIconResolver,
	resolveIcon,
	unregisterIconResolver,
} from '../icon-resolver';
import type { WidgetIcon } from '../../types';

const icon = createElement( 'svg', { viewBox: '0 0 24 24' } ) as WidgetIcon;

describe( 'icon resolver registry', () => {
	afterEach( () => {
		unregisterIconResolver();
	} );

	it( 'resolves to null when no resolver is registered', async () => {
		await expect( resolveIcon( 'core/calendar' ) ).resolves.toBeNull();
	} );

	it( 'resolves references through the registered resolver', async () => {
		const resolver = jest.fn( async () => icon );
		expect( registerIconResolver( resolver ) ).toBe( resolver );

		await expect( resolveIcon( 'core/calendar' ) ).resolves.toBe( icon );
		expect( resolver ).toHaveBeenCalledWith( 'core/calendar' );
	} );

	it( 'keeps the first registered resolver', async () => {
		const first = jest.fn( async () => icon );
		const second = jest.fn( async () => null );

		registerIconResolver( first );
		expect( registerIconResolver( second ) ).toBeUndefined();

		await expect( resolveIcon( 'core/calendar' ) ).resolves.toBe( icon );
		expect( second ).not.toHaveBeenCalled();
	} );

	it( 'degrades to null when the resolver rejects', async () => {
		registerIconResolver( () => Promise.reject( new Error( 'nope' ) ) );

		await expect( resolveIcon( 'core/calendar' ) ).resolves.toBeNull();
	} );

	it( 'unregisters the resolver', async () => {
		const resolver = jest.fn( async () => icon );
		registerIconResolver( resolver );

		expect( unregisterIconResolver() ).toBe( resolver );
		expect( unregisterIconResolver() ).toBeUndefined();

		await expect( resolveIcon( 'core/calendar' ) ).resolves.toBeNull();
	} );
} );
