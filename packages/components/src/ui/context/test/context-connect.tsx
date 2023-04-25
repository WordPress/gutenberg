/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, contextConnectWithoutRef } from '../context-connect';
import type { WordPressComponentProps } from '../wordpress-component';

// Static TypeScript tests
/* eslint-disable jest/expect-expect */
describe( 'ref forwarding', () => {
	const ComponentWithRef = (
		props: WordPressComponentProps< {}, 'div' >,
		ref: ForwardedRef< any >
	) => <div { ...props } ref={ ref } />;
	const ComponentWithoutRef = (
		props: WordPressComponentProps< {}, 'div' >
	) => <div { ...props } />;

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

	it( 'should result in a component with the correct prop types', () => {
		const AcceptsRef = contextConnect( ComponentWithRef, 'Foo' );

		<AcceptsRef ref={ null } />;

		// @ts-expect-error An unaccepted prop should trigger an error
		<AcceptsRef foo={ null } />;

		const NoRef = contextConnectWithoutRef( ComponentWithoutRef, 'Foo' );

		// @ts-expect-error The ref prop should trigger an error
		<NoRef ref={ null } />;

		// @ts-expect-error An unaccepted prop should trigger an error
		<NoRef foo={ null } />;
	} );
} );
/* eslint-enable jest/expect-expect */
