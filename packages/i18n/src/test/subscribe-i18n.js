/**
 * Internal dependencies
 */
import { createI18n } from '..';

/**
 * WordPress dependencies
 */
import { createHooks } from '@wordpress/hooks';

describe( 'i18n updates', () => {
	it( 'updates on setLocaleData', () => {
		const hooks = createHooks();
		const i18n = createI18n( undefined, undefined, hooks );

		const doneTranslations = [];

		function doTranslation() {
			doneTranslations.push( i18n.__( 'original' ) );
		}

		i18n.subscribe( doTranslation );

		// do translation on empty instance with no translation data
		doTranslation();

		// set translation data
		i18n.setLocaleData( {
			original: [ 'translated' ],
		} );

		// add a filter and then remove it
		const filter = ( text ) => '[' + text + ']';
		hooks.addFilter( 'i18n.gettext', 'test', filter );
		hooks.removeFilter( 'i18n.gettext', 'test', filter );

		expect( doneTranslations ).toEqual( [
			'original', // no translations before setLocaleData
			'translated', // after setLocaleData
			'[translated]', // after addFilter
			'translated', // after removeFilter
		] );
	} );
} );
