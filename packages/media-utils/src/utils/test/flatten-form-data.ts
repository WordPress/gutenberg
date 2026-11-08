import { describe, expect, it } from 'vitest';
import { flattenFormData } from '../flatten-form-data';

describe( 'flattenFormData', () => {
	it( 'should flatten arrays using indexed keys', () => {
		const data = new FormData();

		flattenFormData( data, 'image_size', [
			'post-thumbnail',
			'gform-image-choice-lg',
		] );

		expect( Array.from( data.entries() ) ).toStrictEqual( [
			[ 'image_size[0]', 'post-thumbnail' ],
			[ 'image_size[1]', 'gform-image-choice-lg' ],
		] );
	} );

	it( 'should flatten nested data structure', () => {
		const data = new FormData();

		class RichTextData {
			toString() {
				return 'i am rich text';
			}
		}

		const additionalData = {
			foo: null,
			bar: 1234,
			meta: {
				nested: 'foo',
				dothis: true,
				dothat: false,
				supermeta: {
					nested: 'baz',
				},
			},
			customClass: new RichTextData(),
		};

		for ( const [ key, value ] of Object.entries( additionalData ) ) {
			flattenFormData( data, key, value );
		}

		const actual = Object.fromEntries( data.entries() );
		expect( actual ).toStrictEqual( {
			bar: '1234',
			foo: 'null',
			'meta[dothat]': 'false',
			'meta[dothis]': 'true',
			'meta[nested]': 'foo',
			'meta[supermeta][nested]': 'baz',
			customClass: 'i am rich text',
		} );
	} );
} );
