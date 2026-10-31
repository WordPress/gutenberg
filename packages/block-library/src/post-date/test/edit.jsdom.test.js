import { describe, expect, test } from 'vitest';
import { getInitialAttributes, is12HourFormat } from '../edit';

const postDateBinding = {
	source: 'core/post-data',
	args: { field: 'date' },
};

describe( 'getInitialAttributes', () => {
	test( 'sets the current date on a new block outside a Query Loop', () => {
		const initialAttributes = getInitialAttributes( {}, false );

		expect( initialAttributes ).toEqual( {
			datetime: expect.any( Date ),
		} );
	} );

	test( 'binds a new block inside a Query Loop to the post date', () => {
		expect( getInitialAttributes( {}, true ) ).toEqual( {
			metadata: { bindings: { datetime: postDateBinding } },
		} );
	} );

	test( 'keeps other metadata when binding inside a Query Loop', () => {
		const metadata = {
			name: 'Published',
			bindings: {
				isLink: { source: 'core/pattern-overrides' },
			},
		};

		expect( getInitialAttributes( { metadata }, true ) ).toEqual( {
			metadata: {
				name: 'Published',
				bindings: {
					isLink: { source: 'core/pattern-overrides' },
					datetime: postDateBinding,
				},
			},
		} );
	} );

	test.each( [ true, false ] )(
		'leaves a block with a date unchanged (in Query Loop: %p)',
		( isDescendentOfQueryLoop ) => {
			expect(
				getInitialAttributes(
					{ datetime: '2026-08-13T18:23:17.437Z' },
					isDescendentOfQueryLoop
				)
			).toBeNull();
		}
	);

	test.each( [ true, false ] )(
		'leaves a block with a date binding unchanged (in Query Loop: %p)',
		( isDescendentOfQueryLoop ) => {
			expect(
				getInitialAttributes(
					{
						metadata: {
							bindings: {
								datetime: {
									source: 'core/post-data',
									args: { field: 'modified' },
								},
							},
						},
					},
					isDescendentOfQueryLoop
				)
			).toBeNull();
		}
	);
} );

describe( 'is12HourFormat', () => {
	test.each( [
		[ '', false ],
		[ 'H:i', false ],
		[ 'g:i A', true ],
		[ 'g:i a', true ],
		[ 'h:i', true ],
		[ '\\g\\r\\e\\a\\t', false ],
	] )( 'is12HourFormat( %p ) = %p', ( format, expected ) => {
		expect( is12HourFormat( format ) ).toBe( expected );
	} );
} );
