/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useCopyToClipboard, { copyToClipboard, clearSelection } from '../';

interface TestComponentProps {
	text: string | ( () => string );
	onSuccess?: () => void;
}

describe( 'useCopyToClipboard', () => {
	const TestComponent = ( { text, onSuccess }: TestComponentProps ) => {
		const ref = useCopyToClipboard( text, onSuccess );
		return <button ref={ ref }>Copy</button>;
	};

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

	it( 'should call onSuccess when copy succeeds', async () => {
		const user = userEvent.setup();
		const onSuccess = jest.fn();
		render( <TestComponent text="test text" onSuccess={ onSuccess } /> );

		await user.click( screen.getByRole( 'button' ) );

		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call onSuccess when copy empty text', async () => {
		const user = userEvent.setup();
		const onSuccess = jest.fn();
		render( <TestComponent text="" onSuccess={ onSuccess } /> );

		await user.click( screen.getByRole( 'button' ) );

		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not call onSuccess when copy fails', async () => {
		const user = userEvent.setup();
		const onSuccess = jest.fn();
		render( <TestComponent text="test text" onSuccess={ onSuccess } /> );

		jest.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
			new Error()
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( onSuccess ).not.toHaveBeenCalled();
	} );

	it( 'should not call onSuccess after unmount', async () => {
		let resolvePromise: () => void;
		const delayedPromise = new Promise< void >( ( resolve ) => {
			resolvePromise = resolve;
		} );
		jest.spyOn( navigator.clipboard, 'writeText' ).mockReturnValue(
			delayedPromise
		);

		const user = userEvent.setup();
		const onSuccess = jest.fn();
		const { unmount } = render(
			<TestComponent text="test" onSuccess={ onSuccess } />
		);

		await user.click( screen.getByRole( 'button' ) );
		unmount();

		await act( async () => {
			resolvePromise();
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		} );

		expect( onSuccess ).not.toHaveBeenCalled();
	} );
} );

describe( 'copyToClipboard', () => {
	it( 'should use execCommand fallback when clipboard API is not available', async () => {
		const trigger = document.createElement( 'button' );
		document.body.appendChild( trigger );

		const originalClipboard = navigator.clipboard;
		Object.defineProperty( navigator, 'clipboard', {
			value: undefined,
			configurable: true,
		} );

		// JSDOM does not implement execCommand; add a mock for the fallback path.
		// See: https://github.com/jsdom/jsdom/issues/1742
		const execCommandMock = jest.fn().mockReturnValue( true );
		Object.defineProperty( document, 'execCommand', {
			value: execCommandMock,
			configurable: true,
			writable: true,
		} );

		const result = await copyToClipboard( 'fallback text', trigger );

		expect( result ).toBe( true );
		expect( execCommandMock ).toHaveBeenCalledWith( 'copy' );

		delete ( document as { execCommand?: unknown } ).execCommand;
		Object.defineProperty( navigator, 'clipboard', {
			value: originalClipboard,
			configurable: true,
		} );
		document.body.removeChild( trigger );
	} );
} );

describe( 'clearSelection', () => {
	it( 'should focus the trigger element', () => {
		const trigger = document.createElement( 'button' );
		document.body.appendChild( trigger );
		const focusMock = jest.spyOn( trigger, 'focus' );

		clearSelection( trigger );

		expect( focusMock ).toHaveBeenCalledTimes( 1 );

		document.body.removeChild( trigger );
	} );
} );
