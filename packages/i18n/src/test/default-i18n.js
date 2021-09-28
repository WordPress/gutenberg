/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */

/**
 * WordPress dependencies
 */
import { __, _x, _n, _nx } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';

describe( 'i18n filters', () => {
	test( 'Default i18n functions call filters', () => {
		addFilter( 'i18n.gettext', 'tests', () => {
			return 'goodbye';
		} );
		expect( __( 'hello' ) ).toBe( 'goodbye' );
		addFilter( 'i18n.gettext_with_context', 'tests', () => {
			return 'goodbye';
		} );
		expect( _x( 'hello', 'context' ) ).toBe( 'goodbye' );
		addFilter(
			'i18n.ngettext',
			'tests',
			( translation, singular, plural, count ) => {
				if ( count === 1 ) {
					return 'goodbye';
				}
				return 'goodbyes';
			}
		);
		expect( _n( 'hello', 'hellos', 1 ) ).toBe( 'goodbye' );
		expect( _n( 'hello', 'hellos', 2 ) ).toBe( 'goodbyes' );
		addFilter(
			'i18n.ngettext_with_context',
			'tests',
			( translation, singular, plural, count ) => {
				if ( count === 1 ) {
					return 'goodbye';
				}
				return 'goodbyes';
			}
		);
		expect( _nx( 'hello', 'hellos', 1, 'context' ) ).toBe( 'goodbye' );
		expect( _nx( 'hello', 'hellos', 2, 'context' ) ).toBe( 'goodbyes' );
	} );
} );

/* eslint-enable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */
