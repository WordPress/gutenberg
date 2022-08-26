/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, contextConnectWithoutRef } from '../context-connect';

// Static TypeScript tests
describe( 'ref forwarding', () => {
	const ComponentWithRef = ( props: {}, ref: ForwardedRef< any > ) => (
		<div { ...props } ref={ ref } />
	);
	const ComponentWithoutRef = ( props: {} ) => <div { ...props } />;

	it( 'should not trigger a TS error if components are passed to the correct connect* functions', () => {
		contextConnect( ComponentWithRef, 'Foo' );
		contextConnectWithoutRef( ComponentWithoutRef, 'Foo' );
	} );

	it( 'should trigger a TS error if components are passed to the wrong connect* functions', () => {
		// Wrapped in a thunk because React.forwardRef() will throw a console warning if this is executed
		// eslint-disable-next-line no-unused-expressions
		() => {
			// @ts-expect-error This should error
			contextConnect( ComponentWithoutRef, 'Foo' );
		};

		// @ts-expect-error This should error
		contextConnectWithoutRef( ComponentWithRef, 'Foo' );
	} );
} );
