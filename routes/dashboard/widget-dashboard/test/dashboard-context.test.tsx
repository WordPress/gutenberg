/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useWidgetContext } from '../context/widget-context';

function CaptureWidgetContext( {
	onRender,
}: {
	onRender: ( value: ReturnType< typeof useWidgetContext > ) => void;
} ) {
	onRender( useWidgetContext() );
	return null;
}

describe( 'useWidgetContext', () => {
	it( 'returns null outside a widget render subtree', () => {
		const handler = jest.fn();
		render( <CaptureWidgetContext onRender={ handler } /> );
		expect( handler ).toHaveBeenCalledWith( null );
	} );
} );
