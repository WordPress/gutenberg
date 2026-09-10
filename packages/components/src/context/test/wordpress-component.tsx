import { describe, it } from 'vitest';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../wordpress-component';
import { contextConnectWithoutRef } from '../context-connect';

// Static TypeScript checks
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

describe( 'WordPressComponentFromProps', () => {
	it( 'should reject as on a non-polymorphic connected component', () => {
		const Unconnected = (
			props: WordPressComponentProps< {}, null, false >
		) => <div { ...props } />;
		const Foo = contextConnectWithoutRef( Unconnected, 'Foo' );

		// @ts-expect-error Non-polymorphic components must not accept `as`.
		<Foo as="div" />;
	} );
} );
