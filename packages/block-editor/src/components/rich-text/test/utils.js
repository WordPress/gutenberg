/**
 * Internal dependencies
 */
import { addActiveFormats } from '../utils';

describe( 'addActiveFormats', () => {
	const mark1 = {
		type: 'mark',
		attributes: {
			style: 'background-color:rgba(0, 0, 0, 0)',
			class: 'has-inline-color has-accent-4-color',
		},
	};

	const mark2 = {
		type: 'mark',
		attributes: {
			style: 'background-color:rgba(0, 0, 0, 0)',
			class: 'has-inline-color has-accent-2-color',
		},
	};

	const em = { type: 'em' };
	const strong = { type: 'strong' };

	it( 'should add active formats to value with no existing formats', () => {
		const value = {
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'test',
		};

		addActiveFormats( value, [ em ] );

		expect( value.formats ).toEqual( [
			[ em ],
			[ em ],
			[ em ],
			[ em ],
		] );
	} );

	it( 'should add active formats to value with different existing formats', () => {
		const value = {
			formats: [ [ strong ], [ strong ], [ strong ], [ strong ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		addActiveFormats( value, [ em ] );

		expect( value.formats ).toEqual( [
			[ em, strong ],
			[ em, strong ],
			[ em, strong ],
			[ em, strong ],
		] );
	} );

	it( 'should not duplicate identical formats when pasting', () => {
		// This is the fix for https://github.com/WordPress/gutenberg/issues/58806
		// When pasting content with mark element into another mark with same attributes,
		// the mark should not be duplicated
		const value = {
			formats: [ [ mark1 ], [ mark1 ], [ mark1 ], [ mark1 ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		addActiveFormats( value, [ mark1 ] );

		// Should still have only one mark per character, not two
		expect( value.formats ).toEqual( [
			[ mark1 ],
			[ mark1 ],
			[ mark1 ],
			[ mark1 ],
		] );
	} );

	it( 'should allow nesting of different mark formats', () => {
		const value = {
			formats: [ [ mark1 ], [ mark1 ], [ mark1 ], [ mark1 ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		addActiveFormats( value, [ mark2 ] );

		// Should nest different marks
		expect( value.formats ).toEqual( [
			[ mark2, mark1 ],
			[ mark2, mark1 ],
			[ mark2, mark1 ],
			[ mark2, mark1 ],
		] );
	} );

	it( 'should handle multiple active formats with some duplicates', () => {
		const value = {
			formats: [ [ mark1, em ], [ mark1, em ], [ mark1 ], [ strong ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		// Try to add mark1 (already exists) and strong (sometimes exists)
		addActiveFormats( value, [ mark1, strong ] );

		expect( value.formats ).toEqual( [
			// mark1 already exists, strong is new - only strong is added
			[ strong, mark1, em ],
			// mark1 already exists, strong is new - only strong is added
			[ strong, mark1, em ],
			// mark1 already exists, strong is new - only strong is added
			[ strong, mark1 ],
			// mark1 is new, strong already exists - only mark1 is added
			[ mark1, strong ],
		] );
	} );

	it( 'should not modify value when activeFormats is empty', () => {
		const value = {
			formats: [ [ em ], [ em ], [ em ], [ em ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		const originalFormats = value.formats;
		addActiveFormats( value, [] );

		expect( value.formats ).toBe( originalFormats );
	} );

	it( 'should not modify value when activeFormats is null', () => {
		const value = {
			formats: [ [ em ], [ em ], [ em ], [ em ] ],
			replacements: [ , , , , ],
			text: 'test',
		};

		const originalFormats = value.formats;
		addActiveFormats( value, null );

		expect( value.formats ).toBe( originalFormats );
	} );
} );
