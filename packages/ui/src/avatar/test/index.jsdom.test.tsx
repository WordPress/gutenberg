import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import warning from '@wordpress/warning';
import { Avatar } from '../index';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

afterEach( () => vi.useRealTimers() );

describe( 'Avatar fallback', () => {
	it.each( [ undefined, '' ] )(
		'shows the fallback immediately with src=%s despite the internal delay',
		( src ) => {
			render( <Avatar name="Alex Morgan" src={ src } /> );
			expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
		}
	);

	it( 'retains the internal delay while an image is loading', () => {
		vi.useFakeTimers();
		render( <Avatar name="Alex Morgan" src="/portrait.png" /> );
		expect( screen.queryByText( 'AM' ) ).not.toBeInTheDocument();
		act( () => vi.advanceTimersByTime( 299 ) );
		expect( screen.queryByText( 'AM' ) ).not.toBeInTheDocument();
		act( () => vi.advanceTimersByTime( 1 ) );
		expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
	} );

	it( 'shows the fallback when an image fails before the delay ends', () => {
		render( <Avatar name="Alex Morgan" src="/portrait.png" /> );
		fireEvent.error( screen.getByAltText( '' ) );
		expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
	} );
} );

describe( 'Avatar initials', () => {
	it.each( [
		[ '  Alex   Morgan  ', 'AM' ],
		[ 'Alex', 'A' ],
		[ 'Alex Morgan Smith', 'AS' ],
		[ 'e\u0301lodie Marie Dubois', 'E\u0301D' ],
		[ '李 小龙', '李小' ],
		[ '👩🏽‍💻 Alex Morgan', '👩🏽‍💻M' ],
	] )(
		'shows complete first and last initials for %s',
		( name, initials ) => {
			render( <Avatar name={ name } /> );
			expect( screen.getByText( initials ) ).toBeInTheDocument();
		}
	);

	it.each( [ undefined, '', '   ' ] )(
		'leaves the fallback empty and warns for a blank name %s',
		( name ) => {
			// Missing names can still reach the component from JavaScript consumers.
			render( <Avatar name={ name! } aria-label="Unknown person" /> );
			expect(
				screen.getByRole( 'img', { name: 'Unknown person' } )
			).toHaveTextContent( '' );
			expect( warning ).toHaveBeenCalledWith(
				'Avatar: `name` has no displayable characters. Provide a name with visible characters for the initials and accessible label.'
			);
		}
	);
} );
