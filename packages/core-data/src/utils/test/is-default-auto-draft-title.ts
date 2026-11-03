import { afterEach, describe, expect, it } from 'vitest';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import isDefaultAutoDraftTitle from '../is-default-auto-draft-title';

describe( 'isDefaultAutoDraftTitle', () => {
	afterEach( () => {
		resetLocaleData();
	} );

	it( 'matches the English default title', () => {
		expect( isDefaultAutoDraftTitle( 'Auto Draft' ) ).toBe( true );
	} );

	it( 'matches the localized default title', () => {
		setLocaleData( { 'Auto Draft': [ 'Automatický koncept' ] } );
		expect( isDefaultAutoDraftTitle( 'Automatický koncept' ) ).toBe( true );
		expect( isDefaultAutoDraftTitle( 'Auto Draft' ) ).toBe( true );
	} );

	it( 'does not match meaningful titles', () => {
		expect( isDefaultAutoDraftTitle( 'Failed order' ) ).toBe( false );
		expect( isDefaultAutoDraftTitle( '' ) ).toBe( false );
		expect( isDefaultAutoDraftTitle( undefined ) ).toBe( false );
	} );
} );
