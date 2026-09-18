import getCalendarLocale from '../get-calendar-locale';

describe( 'getCalendarLocale', () => {
	it( 'turns a WordPress locale slug into a BCP 47 tag', () => {
		expect( getCalendarLocale( 'en_US' ) ).toBe( 'en-US' );
		expect( getCalendarLocale( 'pt_BR' ) ).toBe( 'pt-BR' );
	} );

	it( 'drops variant suffixes, including invalid BCP 47 ones', () => {
		expect( getCalendarLocale( 'de_DE_formal' ) ).toBe( 'de-DE' );
		expect( getCalendarLocale( 'pt_PT_ao90' ) ).toBe( 'pt-PT' );
	} );

	it( 'aliases a language with no date data', () => {
		// Moroccan Arabic; `Intl` has no `ary` data.
		expect( getCalendarLocale( 'ary' ) ).toBe( 'ar-MA' );
	} );

	it( 'returns undefined when there is no locale to resolve', () => {
		expect( getCalendarLocale( '' ) ).toBeUndefined();
		expect(
			getCalendarLocale( undefined as unknown as string )
		).toBeUndefined();
	} );
} );
