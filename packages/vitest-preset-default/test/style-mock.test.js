import clsx from 'clsx';
import { describe, expect, test } from 'vitest';
import styles from '../scripts/style-mock.js';

describe( 'style mock', () => {
	test( 'returns prefixed kebab-case class names', () => {
		expect( styles.root ).toBe( 'style-root' );
		expect( styles.className ).toBe( 'style-class-name' );
		expect( styles.singleLineClamp ).toBe( 'style-single-line-clamp' );
		expect( styles.Content ).toBe( 'style-content' );
		expect( styles[ 'already-kebab' ] ).toBe( 'style-already-kebab' );
	} );

	test( 'supports clsx object syntax', () => {
		expect(
			clsx( {
				[ styles.conditionalClass ]: true,
			} )
		).toBe( 'style-conditional-class' );
	} );

	test( 'does not mark the mock as an ES module', () => {
		expect( styles.__esModule ).toBeUndefined();
	} );

	test( 'ignores symbol property access', () => {
		expect( styles[ Symbol.toStringTag ] ).toBeUndefined();
	} );
} );
