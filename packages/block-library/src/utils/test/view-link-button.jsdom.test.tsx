import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import ViewLinkButton from '../view-link-button';

// The component's only selector reads the home URL.
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

function getViewLink( url?: string ) {
	render( <ViewLinkButton url={ url } /> );
	return screen.queryByRole( 'link', { name: 'View' } );
}

describe( 'ViewLinkButton', () => {
	beforeEach( () => {
		( useSelect as Mock ).mockReturnValue( 'https://example.com' );
	} );

	test.each< [ string | undefined, string ] >( [
		[ undefined, 'no URL' ],
		[ '', 'an empty URL' ],
	] )( 'renders nothing for %s (%s)', ( url ) => {
		expect( getViewLink( url ) ).toBeNull();
	} );

	test( 'renders nothing for a relative link while the home URL is unknown', () => {
		( useSelect as Mock ).mockReturnValue( undefined );
		expect( getViewLink( '/page' ) ).toBeNull();
	} );

	test( 'opens the link resolved against the home URL in a new tab', () => {
		const viewLink = getViewLink( '#section' );
		expect( viewLink ).toHaveAttribute(
			'href',
			'https://example.com/#section'
		);
		expect( viewLink ).toHaveAttribute( 'target', '_blank' );
	} );
} );
