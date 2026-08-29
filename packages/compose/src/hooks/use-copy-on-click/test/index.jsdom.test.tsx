import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import deprecated from '@wordpress/deprecated';
import { useRef } from '@wordpress/element';
import useCopyOnClick from '../';

vi.mock( import( '@wordpress/deprecated' ) );

interface TestComponentProps {
	text: string | ( () => string );
	timeout?: number;
}

describe( 'useCopyOnClick', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	const TestComponent = ( { text, timeout = 4000 }: TestComponentProps ) => {
		const ref = useRef< HTMLButtonElement >( null );
		const hasCopied = useCopyOnClick( ref, text, timeout );
		return (
			<button ref={ ref } type="button">
				{ hasCopied ? 'Copied!' : 'Copy' }
			</button>
		);
	};

	it( 'should call deprecated when the hook is used', () => {
		vi.mocked( deprecated ).mockClear();
		render( <TestComponent text="test text" /> );

		expect( deprecated ).toHaveBeenCalledWith(
			'wp.compose.useCopyOnClick',
			{
				since: '5.8',
				alternative: 'wp.compose.useCopyToClipboard',
			}
		);
	} );

	it( 'should copy text on click', async () => {
		const user = userEvent.setup();
		render( <TestComponent text="test text" /> );

		const writeTextMock = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		await user.click( screen.getByRole( 'button' ) );

		expect( writeTextMock ).toHaveBeenCalledTimes( 1 );
		expect( writeTextMock ).toHaveBeenCalledWith( 'test text' );
	} );

	it( 'should set hasCopied to true when copy succeeds', async () => {
		const user = userEvent.setup();
		render( <TestComponent text="test text" /> );

		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copied!' );
	} );

	it( 'should reset hasCopied after timeout', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		const user = userEvent.setup( {
			advanceTimers: ( delay ) => vi.advanceTimersByTime( delay ),
		} );
		render( <TestComponent text="test text" timeout={ 1000 } /> );

		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			await vi.advanceTimersByTimeAsync( 0 );
		} );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copied!' );

		await act( async () => {
			await vi.advanceTimersByTimeAsync( 1000 );
		} );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );
	} );

	it( 'should not set hasCopied when copy fails', async () => {
		const user = userEvent.setup();
		render( <TestComponent text="test text" /> );

		vi.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
			new Error()
		);

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );
	} );

	it( 'should not update hasCopied after unmount', async () => {
		const renderSpy = vi.fn();

		const SpyComponent = ( { text }: { text: string } ) => {
			const ref = useRef< HTMLButtonElement >( null );
			const hasCopied = useCopyOnClick( ref, text );
			renderSpy( hasCopied );
			return (
				<button ref={ ref } type="button">
					{ hasCopied ? 'Copied!' : 'Copy' }
				</button>
			);
		};

		let resolvePromise: () => void;
		const delayedPromise = new Promise< void >( ( resolve ) => {
			resolvePromise = resolve;
		} );
		vi.spyOn( navigator.clipboard, 'writeText' ).mockReturnValue(
			delayedPromise as Promise< void >
		);

		const user = userEvent.setup();
		const { unmount } = render( <SpyComponent text="test" /> );

		expect( renderSpy ).toHaveBeenLastCalledWith( false );
		const renderCountBeforeUnmount = renderSpy.mock.calls.length;

		await user.click( screen.getByRole( 'button' ) );
		unmount();

		await act( async () => {
			resolvePromise();
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		// No additional renders after unmount — setHasCopied(true) was not called.
		expect( renderSpy ).toHaveBeenCalledTimes( renderCountBeforeUnmount );
	} );
} );
