/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useCopyOnClick from '../';

jest.mock( '@wordpress/deprecated' );

interface TestComponentProps {
	text: string | ( () => string );
	timeout?: number;
}

describe( 'useCopyOnClick', () => {
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
		jest.mocked( deprecated ).mockClear();
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

		const writeTextMock = jest
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		await user.click( screen.getByRole( 'button' ) );

		expect( writeTextMock ).toHaveBeenCalledTimes( 1 );
		expect( writeTextMock ).toHaveBeenCalledWith( 'test text' );
	} );

	it( 'should set hasCopied to true when copy succeeds', async () => {
		const user = userEvent.setup();
		render( <TestComponent text="test text" /> );

		jest.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copied!' );
	} );

	it( 'should reset hasCopied after timeout', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		render( <TestComponent text="test text" timeout={ 1000 } /> );

		jest.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			const p = new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			jest.advanceTimersByTime( 0 );
			await p;
		} );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copied!' );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );

		jest.useRealTimers();
	} );

	it( 'should not set hasCopied when copy fails', async () => {
		const user = userEvent.setup();
		render( <TestComponent text="test text" /> );

		jest.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
			new Error()
		);

		await user.click( screen.getByRole( 'button' ) );

		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Copy' );
	} );

	it( 'should not update hasCopied after unmount', async () => {
		const renderSpy = jest.fn();

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
		jest.spyOn( navigator.clipboard, 'writeText' ).mockReturnValue(
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
