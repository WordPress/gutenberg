import { describe, expect, it } from 'vitest';
import engine from '../lib/engine';

describe( 'Engine', () => {
	it( 'should return a void IR for undefined code', () => {
		const { ir } = engine( undefined );
		expect( ir ).toHaveLength( 0 );
	} );

	it( 'parses JSX in JavaScript without a Babel configuration', () => {
		const { ast } = engine(
			'example.js',
			'export const element = <div />;'
		);

		expect( ast.body[ 0 ].declaration.declarations[ 0 ].init.type ).toBe(
			'JSXElement'
		);
	} );

	it( 'parses TypeScript type assertions without enabling JSX', () => {
		const { ast } = engine(
			'example.ts',
			'export const value = <number>1;'
		);

		expect( ast.body[ 0 ].declaration.declarations[ 0 ].init.type ).toBe(
			'TSTypeAssertion'
		);
	} );
} );
