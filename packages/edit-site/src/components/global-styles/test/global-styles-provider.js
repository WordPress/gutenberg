/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from '../global-styles-provider';
import { DEFAULT_FONT_FAMILY } from '../constants';

describe( 'global styles provider', () => {
	describe( 'mergeBaseAndUserConfigs', () => {
		it( 'should output value if non-default fontFamily is used', () => {
			const { base, user } = makeConfigs( 'serif' );
			const result = mergeBaseAndUserConfigs( base, user );
			expect( result.styles.elements.h1.fontFamily ).toBe( 'serif' );
		} );

		it( 'should output null if default fontFamily is used', () => {
			const { base, user } = makeConfigs( DEFAULT_FONT_FAMILY );
			const result = mergeBaseAndUserConfigs( base, user );
			expect( result.styles.elements.h1.fontFamily ).toBe( null );
		} );
	} );
} );

const makeConfigs = ( fontFamily ) => {
	return {
		base: {
			styles: {
				elements: {
					h1: {
						fontFamily: 'base',
					},
				},
			},
		},
		user: {
			styles: {
				elements: {
					h1: {
						fontFamily,
					},
				},
			},
		},
	};
};
