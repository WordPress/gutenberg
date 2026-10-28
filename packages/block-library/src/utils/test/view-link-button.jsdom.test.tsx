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

	test.each( [
		'javascript:alert(1)',
		'JavaScript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)',
	] )( 'renders nothing for a %s link', ( url ) => {
		expect( getViewLink( url ) ).toBeNull();
	} );

	test.each( [
		[ 'https://wordpress.org', 'https://wordpress.org/' ],
		[ 'http://wordpress.org', 'http://wordpress.org/' ],
		[ 'mailto:hello@example.com', 'mailto:hello@example.com' ],
		[ 'tel:+15555550100', 'tel:+15555550100' ],
	] )( 'opens a %s link', ( url, href ) => {
		expect( getViewLink( url ) ).toHaveAttribute( 'href', href );
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
