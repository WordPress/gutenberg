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
import type { WordPressComponentProps } from '../wordpress-component';

// Static TypeScript checks
/* eslint-disable jest/expect-expect */
describe( 'WordPressComponentProps', () => {
	it( 'should not accept a ref', () => {
		const Foo = ( props: WordPressComponentProps< {}, 'div' > ) => (
			<div { ...props } />
		);

		// @ts-expect-error The ref prop should trigger an error.
		<Foo ref={ null } />;
	} );

	it( 'should accept a ref if wrapped by a forwardRef()', () => {
		const Foo = (
			props: WordPressComponentProps< {}, 'div' >,
			ref: ForwardedRef< any >
		) => <div { ...props } ref={ ref } />;
		const ForwardedFoo = forwardRef( Foo );

		<ForwardedFoo ref={ null } />;
	} );
} );
/* eslint-enable jest/expect-expect */
