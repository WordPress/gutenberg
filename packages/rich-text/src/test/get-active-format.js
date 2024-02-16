/**
 * Internal dependencies
 */

import { getActiveFormat } from '../get-active-format';

describe( 'getActiveFormat', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };

	it( 'should return undefined if there is no selection', () => {
		const record = {
			formats: [ [ em ], [ em ], [ em ] ],
			_formats: new Map( [ [ em, [ 0, 3 ] ] ] ),
			text: 'one',
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );

	it( 'should return format when active over whole selection', () => {
		const record = {
			formats: [ [ em ], [ strong ], , ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ strong, [ 1, 2 ] ],
			] ),
			text: 'one',
			start: 0,
			end: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( em );
	} );

	it( 'should return not return format when not active over whole selection', () => {
		const record = {
			formats: [ [ em ], [ strong ], , ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ strong, [ 1, 2 ] ],
			] ),
			text: 'one',
			start: 0,
			end: 2,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );

	it( 'should return undefined if at the boundary before', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ { ...em }, [ 2, 3 ] ],
			] ),
			text: 'one',
			start: 3,
			end: 3,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );

	it( 'should return undefined if at the boundary after', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ { ...em }, [ 2, 3 ] ],
			] ),
			text: 'one',
			start: 1,
			end: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );

	it( 'should return format if inside format', () => {
		const record = {
			formats: [ [ em ], [ em ], [ em ] ],
			_formats: new Map( [ [ em, [ 0, 3 ] ] ] ),
			text: 'one',
			start: 1,
			end: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( em );
	} );

	it( 'should return activeFormats', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ { ...em }, [ 2, 3 ] ],
			] ),
			text: 'one',
			start: 1,
			end: 1,
			activeFormats: [ em ],
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( em );
	} );

	it( 'should not return activeFormats for uncollapsed selection', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			_formats: new Map( [
				[ em, [ 0, 1 ] ],
				[ { ...em }, [ 2, 3 ] ],
			] ),
			text: 'one',
			start: 1,
			end: 2,
			activeFormats: [ em ],
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );
} );
