import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import type { Avatar as _Avatar } from '@base-ui/react/avatar';
import * as Avatar from '../index';

afterEach( () => vi.useRealTimers() );

describe( 'Avatar fallback', () => {
	it.each( [ undefined, '' ] )(
		'shows the fallback immediately with src=%s despite a delay',
		( src ) => {
			render(
				<Avatar.Root>
					<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
					<Avatar.Image src={ src } alt="" />
				</Avatar.Root>
			);
			expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
		}
	);

	it( 'shows the fallback immediately when there is no image part', () => {
		const ref = createRef< HTMLSpanElement >();
		render(
			<Avatar.Root>
				<Avatar.Fallback
					delay={ 300 }
					ref={ ref }
					render={ <span title="Custom fallback" /> }
					className="custom-fallback"
				>
					AM
				</Avatar.Fallback>
			</Avatar.Root>
		);
		expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
		expect( ref.current ).toBe( screen.getByTitle( 'Custom fallback' ) );
		expect( ref.current ).toHaveClass( 'custom-fallback' );
	} );

	it( 'retains the requested delay while an image is loading', () => {
		vi.useFakeTimers();
		render(
			<Avatar.Root>
				<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
				<Avatar.Image src="/portrait.png" alt="" keepMounted />
			</Avatar.Root>
		);
		expect( screen.queryByText( 'AM' ) ).not.toBeInTheDocument();
		act( () => vi.advanceTimersByTime( 299 ) );
		expect( screen.queryByText( 'AM' ) ).not.toBeInTheDocument();
		act( () => vi.advanceTimersByTime( 1 ) );
		expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
	} );

	it( 'shows the fallback when an image fails before the delay ends', () => {
		render(
			<Avatar.Root>
				<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
				<Avatar.Image src="/portrait.png" alt="" keepMounted />
			</Avatar.Root>
		);
		fireEvent.error( screen.getByAltText( '' ) );
		expect( screen.getByText( 'AM' ) ).toBeInTheDocument();
	} );
} );

describe( 'Avatar custom rendering', () => {
	it.each( [ 'Fallback', 'Initials' ] as const )(
		'passes image loading state to custom %s rendering',
		( part ) => {
			// The public render type only advertises props; verify runtime state with an optional parameter.
			const customRender = (
				elementProps: React.ComponentPropsWithRef< 'span' >,
				state?: _Avatar.Fallback.State
			) => (
				<span { ...elementProps } title={ state?.imageLoadingStatus } />
			);
			const fallback =
				part === 'Fallback' ? (
					<Avatar.Fallback render={ customRender }>
						AM
					</Avatar.Fallback>
				) : (
					<Avatar.Initials
						name="Alex Morgan"
						render={ customRender }
					/>
				);
			const { rerender } = render(
				<Avatar.Root>{ fallback }</Avatar.Root>
			);
			expect( screen.getByTitle( 'idle' ) ).toHaveTextContent( 'AM' );

			rerender(
				<Avatar.Root>
					{ fallback }
					<Avatar.Image src="/portrait.png" alt="" keepMounted />
				</Avatar.Root>
			);
			expect( screen.getByTitle( 'loading' ) ).toHaveTextContent( 'AM' );

			fireEvent.error( screen.getByAltText( '' ) );
			expect( screen.getByTitle( 'error' ) ).toHaveTextContent( 'AM' );
		}
	);
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
			render(
				<Avatar.Root>
					<Avatar.Initials name={ name } />
				</Avatar.Root>
			);
			expect( screen.getByText( initials ) ).toBeInTheDocument();
		}
	);

	it.each( [ undefined, '', '   ' ] )(
		'shows the person fallback for a blank name %s',
		( name ) => {
			render(
				<Avatar.Root role="img" aria-label="Unknown person">
					<Avatar.Initials name={ name } />
				</Avatar.Root>
			);
			expect(
				within(
					screen.getByRole( 'img', { name: 'Unknown person' } )
				).getByRole( 'presentation', { hidden: true } )
			).toBeInTheDocument();
		}
	);
} );
