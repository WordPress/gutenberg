import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
		const handler = vi.fn();
		render( <CaptureWidgetContext onRender={ handler } /> );
		expect( handler ).toHaveBeenCalledWith( null );
	} );
} );
