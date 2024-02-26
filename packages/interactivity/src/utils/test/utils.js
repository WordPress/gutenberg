/**
 * Internal dependencies
 */
import { kebabToCamelCase } from '../kebab-to-camelcase';

describe( 'kebabToCamelCase', () => {
	it( 'should work exactly as the PHP version', async () => {
		expect( kebabToCamelCase( '' ) ).toBe( '' );
		expect( kebabToCamelCase( 'item' ) ).toBe( 'item' );
		expect( kebabToCamelCase( 'my-item' ) ).toBe( 'myItem' );
		expect( kebabToCamelCase( 'my_item' ) ).toBe( 'my_item' );
		expect( kebabToCamelCase( 'My-iTem' ) ).toBe( 'myItem' );
		expect( kebabToCamelCase( 'my-item-with-multiple-hyphens' ) ).toBe(
			'myItemWithMultipleHyphens'
		);
		expect( kebabToCamelCase( 'my-item-with--double-hyphens' ) ).toBe(
			'myItemWith-DoubleHyphens'
		);
		expect( kebabToCamelCase( 'my-item-with_under-score' ) ).toBe(
			'myItemWith_underScore'
		);
		expect( kebabToCamelCase( '-my-item' ) ).toBe( 'myItem' );
		expect( kebabToCamelCase( 'my-item-' ) ).toBe( 'myItem' );
		expect( kebabToCamelCase( '-my-item-' ) ).toBe( 'myItem' );
	} );
} );
