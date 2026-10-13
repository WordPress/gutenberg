import { describe, expect, it } from 'vitest';
import { asDangerousHTML, type DangerousHTML } from '../html';

// These checks run at type-check time: each `@ts-expect-error` fails the
// type check if the line below it stops being a type error.
function acceptsDangerousHTML( value: DangerousHTML ): DangerousHTML {
	return value;
}

describe( 'DangerousHTML type', () => {
	it( 'only accepts values returned by asDangerousHTML()', () => {
		acceptsDangerousHTML( asDangerousHTML( '<strong>Hi</strong>' ) );

		// @ts-expect-error A string is not trusted HTML.
		acceptsDangerousHTML( '' );

		// @ts-expect-error An empty object is not trusted HTML.
		acceptsDangerousHTML( {} );

		// A hand-written look-alike, branded with a different symbol of the
		// same name and the same value.
		const dangerousHTMLBrand = Symbol( 'dangerousHTMLBrand' );
		const lookAlike = { [ dangerousHTMLBrand ]: 'DangerousHTML' } as const;
		// @ts-expect-error A look-alike object is not trusted HTML.
		acceptsDangerousHTML( lookAlike );

		expect( true ).toBe( true );
	} );
} );
