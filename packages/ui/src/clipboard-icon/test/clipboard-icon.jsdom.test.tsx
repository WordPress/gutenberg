import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { ClipboardIcon } from '../index';

describe( 'ClipboardIcon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <ClipboardIcon ref={ ref } status="pending" /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );

	it( 'renders a different icon for each status', () => {
		const { rerender, asFragment } = render(
			<ClipboardIcon status="pending" />
		);
		const pendingMarkup = asFragment();

		rerender( <ClipboardIcon status="success" /> );
		const successMarkup = asFragment();
		expect( successMarkup ).not.toEqual( pendingMarkup );

		rerender( <ClipboardIcon status="error" /> );
		expect( asFragment() ).not.toEqual( pendingMarkup );
		expect( asFragment() ).not.toEqual( successMarkup );
	} );
} );
