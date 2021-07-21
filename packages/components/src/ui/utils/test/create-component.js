/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createComponent } from '../create-component';

describe( 'createComponent', () => {
	/**
	 * @param {import('../context').PolymorphicComponentProps<{}, 'output'>} props
	 */
	const useHook = ( props ) => ( { ...props, 'data-hook-test-prop': true } );
	const name = 'Output';
	const MemoizedOutput = createComponent( {
		as: 'output',
		name,
		useHook,
		memo: true,
	} );
	const Output = createComponent( {
		as: 'output',
		name,
		useHook,
		memo: false,
	} );

	it( 'should create a output component', () => {
		const { container } = render(
			<MemoizedOutput>Example output</MemoizedOutput>
		);

		expect( container.firstChild.tagName ).toBe( 'OUTPUT' );
		expect( container.firstChild.innerHTML ).toBe( 'Example output' );
	} );

	it( 'should create a memoized, ref-forwarded component', () => {
		expect( MemoizedOutput.$$typeof ).toEqual( Symbol.for( 'react.memo' ) );
		const ref = createRef();
		const wrapper = render(
			<MemoizedOutput ref={ ref }>Example output</MemoizedOutput>
		);

		expect( ref.current ).toEqual( wrapper.container.firstChild );
	} );

	it( 'should create a non-memoized ref-forwarded ouput component', () => {
		expect( Output.$$typeof ).toEqual( Symbol.for( 'react.forward_ref' ) );
		const ref = createRef();
		const wrapper = render( <Output ref={ ref }>Example output</Output> );

		expect( ref.current ).toEqual( wrapper.container.firstChild );
	} );

	it( 'should apply the hook to the component props', () => {
		const { container } = render( <Output>Example output</Output> );
		expect( container.firstChild.dataset.hookTestProp ).toBe( 'true' );
	} );

	it( 'should connect the component to its context', () => {
		expect( MemoizedOutput.__contextSystemKey__ ).toContain( 'Output' );
	} );
} );
