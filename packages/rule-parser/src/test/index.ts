/**
 * Internal dependencies
 */
import type { Rules, RawRule, Store, Source, Target } from '../types';
import { parser, registry } from '..';

const store: Store = {
	'cart.cartTotal': 75,
	'cart.cartItems': [ 1, 2, 3, 4, 5 ],
	'customer.id': 1,
	'customer.role': 'custom-role',
};

describe( 'Parser', () => {
	it( 'should parse simple rules', () => {
		const rules: Rules< RawRule > = [
			[ 'cart.cartTotal', 'less than', 100 ],
			[ 'cart.cartTotal', 'greater than', 50 ],
			[ 'cart.cartItems', 'contains', 5 ],
			[ 'cart.cartItems', 'not contains', 6 ],
			[ 'customer.id', 'in', [ 1, 2, 3 ] ],
			[ 'customer.id', 'not in', [ 4, 5, 6 ] ],
			[ 'customer.role', 'is', 'custom-role' ],
			[ 'customer.role', 'not is', 'customer' ],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse rule with ALL', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[
				[ 'cart.cartTotal', 'less than', 100 ],
				[ 'cart.cartTotal', 'greater than', 50 ],
				[ 'cart.cartItems', 'contains', 5 ],
				[ 'cart.cartItems', 'not contains', 6 ],
			],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse rule with ANY', () => {
		const rules: Rules< RawRule > = [
			'ANY',
			[
				[ 'cart.cartTotal', 'less than', 100 ],
				[ 'customer.id', 'is', 3 ],
			],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse nested rules', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[
				[ 'cart.cartTotal', 'less than', 100 ],
				[ 'cart.cartTotal', 'greater than', 50 ],
				[
					'ANY',
					[
						[ 'cart.cartItems', 'contains', 5 ],
						[ 'cart.cartItems', 'not contains', 6 ],
					],
				],
			],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse rules with aliases', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[
				[ 'cart.cartTotal', '<', 100 ],
				[ 'cart.cartTotal', '>', 50 ],
				[ 'cart.cartTotal', 'lte', 75 ],
				[ 'cart.cartTotal', 'gte', 75 ],
				[ 'customer.id', '=', 1 ],
				[ 'customer.id', '!=', 2 ],
			],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse rules that return false', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[
				[ 'cart.cartTotal', 'less than', 100 ],
				[ 'cart.cartTotal', 'greater than', 100 ],
			],
		];

		expect( parser( rules, store ) ).toBe( false );
	} );

	it( 'should parse rules that return false and ANY', () => {
		const rules: Rules< RawRule > = [
			'ANY',
			[
				[ 'cart.cartTotal', 'greater than', 100 ],
				[ 'cart.cartTotal', 'less than', 50 ],
			],
		];

		expect( parser( rules, store ) ).toBe( false );
	} );

	it( 'should parse rules with greater than or equal to', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[ [ 'cart.cartTotal', 'gte', 75 ] ],
		];

		expect( parser( rules, store ) ).toBe( true );
	} );

	it( 'should parse rules with floating numbers', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[ [ 'cart.cartTotal', 'less than', 75.5 ] ],
		];

		expect( parser( rules, { 'cart.cartTotal': '75.3' } ) ).toBe( true );
	} );

	it( 'should not parse with nonexistent comparator', () => {
		const rules: Rules< RawRule > = [
			'ALL',
			[
				[ 'cart.cartTotal', 'does not exist', 100 ],
				[ 'cart.cartTotal', 'does not exist', 50 ],
			],
		];

		const error = () => {
			parser( rules, store );
		};

		expect( error ).toThrow(
			`No such evaluator with key "does not exist" exists.`
		);
	} );

	it( 'should parse with newly introduced evaluator', () => {
		const betweenEvaluator = ( source: Source, target: Target ) => {
			return source >= target[ 0 ] && source <= target[ 1 ];
		};

		registry.register( 'between', betweenEvaluator );

		const rules: Rules< RawRule > = [
			'ALL',
			[ [ 'cart.cartTotal', 'between', [ 50, 100 ] ] ],
		];

		expect( parser( rules, store ) ).toBe( true );

		const falseRules: Rules< RawRule > = [
			'ALL',
			[ [ 'cart.cartTotal', 'between', [ 100, 200 ] ] ],
		];

		expect( parser( falseRules, store ) ).toBe( false );
	} );

	it( 'should correctly evaluate contains operator with arrays', () => {
		const rulesSourceArray: Rules< RawRule > = [
			'ALL',
			[ [ 'cart.items', 'contains', [ 'apple', 'orange' ] ] ],
		];

		const storeSourceArray = {
			'cart.items': [ 'banana', 'apple', 'orange' ],
		};

		expect( parser( rulesSourceArray, storeSourceArray ) ).toBe( true );
	} );
} );
