/**
 * Internal dependencies
 */
import { getClassNames } from '../util';

describe( 'getClassNames', () => {
	it( 'should remove aspect ratio classes if provided a false value for allowResponsive', () => {
		const html = '';
		const existingClassNames = 'foo wp-has-aspect-ratio wp-has-aspect-ratio wp-embed-aspect-21-9';

		const classNames = getClassNames( html, existingClassNames, false );

		expect( classNames ).toBe( 'foo' );
	} );

	it( 'should return existing class names if allowResponsive=false, but no responsive classes', () => {
		const html = '';

		[ undefined, '', 'foo' ].forEach( ( existingClassNames ) => {
			const classNames = getClassNames( html, existingClassNames, false );

			expect( classNames ).toBe( existingClassNames );
		} );
	} );

	it( 'should produce responsive class names from an iframe dimensions', () => {
		const html = '<iframe width="21.001" height="9.001"></iframe>';
		const existingClassNames = undefined;

		const classNames = getClassNames( html, existingClassNames );

		expect( classNames ).toBe( 'wp-embed-aspect-21-9 wp-has-aspect-ratio' );
	} );

	it( 'should return existing class names if there are no iframes in html', () => {
		const html = '';

		[ undefined, '', 'foo' ].forEach( ( existingClassNames ) => {
			const classNames = getClassNames( html, existingClassNames, false );

			expect( classNames ).toBe( existingClassNames );
		} );
	} );
} );
