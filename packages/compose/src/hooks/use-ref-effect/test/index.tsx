/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import useRefEffect from '../';

jest.mock( '@wordpress/deprecated' );

describe( 'useRefEffect', () => {
	const TestComponent = () => {
		const ref = useRefEffect( () => {}, [] );
		return <div ref={ ref } />;
	};

	it( 'should call deprecated when the hook is used', () => {
		jest.mocked( deprecated ).mockClear();
		render( <TestComponent /> );

		expect( deprecated ).toHaveBeenCalledWith( 'wp.compose.useRefEffect', {
			since: '7.1',
			alternative: 'useCallback',
			link: 'https://react.dev/reference/react/useCallback#ref-callback-cleanup',
		} );
	} );
} );
