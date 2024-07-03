/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressPolymorphicComponentProps } from '../wordpress-component';

// Static TypeScript checks
/* eslint-disable jest/expect-expect */
describe( 'WordPressComponentProps', () => {
	it( 'should not accept a ref', () => {
		const Foo = (
			props: WordPressPolymorphicComponentProps< {}, 'div' >
		) => <div { ...props } />;

		// @ts-expect-error The ref prop should trigger an error.
		<Foo ref={ null } />;
	} );

	it( 'should accept a ref if wrapped by a forwardRef()', () => {
		const Foo = (
			props: WordPressPolymorphicComponentProps< {}, 'div' >,
			ref: ForwardedRef< any >
		) => <div { ...props } ref={ ref } />;
		const ForwardedFoo = forwardRef( Foo );

		<ForwardedFoo ref={ null } />;
	} );
} );
/* eslint-enable jest/expect-expect */
