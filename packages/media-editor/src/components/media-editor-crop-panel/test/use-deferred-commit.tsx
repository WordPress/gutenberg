/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useDeferredCommit } from '../use-deferred-commit';
import { makeRange } from '../crop-input-utils';

const RANGE = makeRange( 0, 500 );

function fakeKeyboardEvent(
	key: 'Enter' | 'Escape'
): React.KeyboardEvent< HTMLInputElement > {
	const target = { blur: jest.fn() };
	return {
		key,
		preventDefault: jest.fn(),
		currentTarget: target,
		target,
	} as unknown as React.KeyboardEvent< HTMLInputElement >;
}

describe( 'useDeferredCommit', () => {
	it( 'renders the formatted value when not focused', () => {
		const onCommit = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 123,
				range: RANGE,
				commitStep: 1,
				onCommit,
			} )
		);

		expect( result.current.value ).toBe( '123' );
		expect( result.current.min ).toBe( 0 );
		expect( result.current.max ).toBe( 500 );
		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'commits valid in-range drafts immediately', () => {
		const onCommit = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );

		expect( onCommit ).toHaveBeenCalledWith( 250 );
	} );

	it( 'keeps input bounds active while focused', () => {
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit: jest.fn(),
			} )
		);

		act( () => result.current.onFocus() );

		expect( result.current.min ).toBe( 0 );
		expect( result.current.max ).toBe( 500 );
	} );

	it( 'does not commit out-of-range drafts until completion', () => {
		const onCommit = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '9999' ) );

		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'previews valid drafts without committing when live commits are disabled', () => {
		const onCommit = jest.fn();
		const onPreview = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				commitOnChange: false,
				onCommit,
				onPreview,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );

		expect( onPreview ).toHaveBeenCalledWith( 250 );
		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'commits deferred preview drafts on blur', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const onPreview = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				commitOnChange: false,
				onCommit,
				onCommitEnd,
				onPreview,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		act( () => result.current.onBlur() );

		expect( onCommit ).toHaveBeenCalledWith( 250 );
		expect( onPreview ).toHaveBeenLastCalledWith( null );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clears deferred previews on Escape without committing', () => {
		const onCommit = jest.fn();
		const onPreview = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				commitOnChange: false,
				onCommit,
				onPreview,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		act( () => result.current.onKeyDown( fakeKeyboardEvent( 'Escape' ) ) );

		expect( onPreview ).toHaveBeenLastCalledWith( null );
		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'cancels deferred previews when value changes externally during focus', async () => {
		const onCommit = jest.fn();
		const onPreview = jest.fn();
		const { result, rerender } = renderHook(
			( { value }: { value: number } ) =>
				useDeferredCommit( {
					value,
					range: RANGE,
					commitStep: 1,
					commitOnChange: false,
					onCommit,
					onPreview,
				} ),
			{ initialProps: { value: 100 } }
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		rerender( { value: 300 } );

		await waitFor( () => expect( result.current.value ).toBe( '300' ) );
		expect( onPreview ).toHaveBeenLastCalledWith( null );
		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'does not commit outward edits from an already out-of-range value', () => {
		const onCommit = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: -10,
				range: RANGE,
				commitStep: 1,
				onCommit,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '-9' ) );

		expect( result.current.value ).toBe( '-9' );
		expect( result.current.min ).toBe( 0 );
		expect( result.current.max ).toBe( 500 );
		expect( onCommit ).not.toHaveBeenCalled();
	} );

	it( 'clamps and finalises on blur', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '9999' ) );
		act( () => result.current.onBlur() );

		expect( onCommit ).toHaveBeenCalledWith( 500 );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not fire onCommitEnd until the user blurs or presses Enter', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		act( () => result.current.onChange( '300' ) );
		act( () => result.current.onChange( '350' ) );

		// Live commits fire as the user types, but the completion signal
		// waits for an explicit boundary (blur or Enter) so session cleanup
		// and final history flushing still happen once.
		expect( onCommit ).toHaveBeenCalledTimes( 3 );
		expect( onCommitEnd ).not.toHaveBeenCalled();
	} );

	it( 'leaves out-of-range drafts editable until blur', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '9999' ) );

		// Draft stays exactly as typed; nothing fires until the user signals
		// completion explicitly.
		expect( result.current.value ).toBe( '9999' );
		expect( onCommit ).not.toHaveBeenCalled();
		expect( onCommitEnd ).not.toHaveBeenCalled();

		act( () => result.current.onBlur() );

		expect( onCommit ).toHaveBeenLastCalledWith( 500 );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'commits + finalises on Enter', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		act( () => result.current.onKeyDown( fakeKeyboardEvent( 'Enter' ) ) );

		expect( onCommit ).toHaveBeenLastCalledWith( 250 );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'commits the latest draft when change and blur happen before a rerender', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		const handlers = result.current;

		act( () => {
			handlers.onChange( '250' );
			handlers.onBlur();
		} );

		expect( onCommit ).toHaveBeenCalledTimes( 1 );
		expect( onCommit ).toHaveBeenLastCalledWith( 250 );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'rolls back to the focus-time value on Escape', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit,
				onCommitEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		expect( onCommit ).toHaveBeenLastCalledWith( 250 );

		act( () => result.current.onKeyDown( fakeKeyboardEvent( 'Escape' ) ) );

		expect( onCommit ).toHaveBeenLastCalledWith( 100 );
		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the typed draft when external state changes during focus', () => {
		const onCommit = jest.fn();
		const { result, rerender } = renderHook(
			( { value }: { value: number } ) =>
				useDeferredCommit( {
					value,
					range: RANGE,
					commitStep: 1,
					onCommit,
				} ),
			{ initialProps: { value: 100 } }
		);

		act( () => result.current.onFocus() );
		// External change (undo, settle, sibling commit, anything) reaches the
		// hook as a new `value` prop. While focused, the input stays sovereign.
		rerender( { value: 200 } );

		expect( result.current.value ).toBe( '100' );
	} );

	it( 'keeps an in-progress draft when external state changes during focus', () => {
		const onCommit = jest.fn();
		const { result, rerender } = renderHook(
			( { value }: { value: number } ) =>
				useDeferredCommit( {
					value,
					range: RANGE,
					commitStep: 1,
					onCommit,
				} ),
			{ initialProps: { value: 100 } }
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		rerender( { value: 300 } );

		expect( result.current.value ).toBe( '250' );
	} );

	it( 'displays the latest external value once the user blurs', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result, rerender } = renderHook(
			( { value }: { value: number } ) =>
				useDeferredCommit( {
					value,
					range: RANGE,
					commitStep: 1,
					onCommit,
					onCommitEnd,
				} ),
			{ initialProps: { value: 100 } }
		);

		act( () => result.current.onFocus() );
		rerender( { value: 200 } );
		expect( result.current.value ).toBe( '100' );

		act( () => result.current.onBlur() );

		expect( result.current.value ).toBe( '200' );
		expect( onCommit ).not.toHaveBeenCalled();
		expect( onCommitEnd ).not.toHaveBeenCalled();
	} );

	it( 'does not commit the focus-time value on Enter when only external state changed', () => {
		const onCommit = jest.fn();
		const onCommitEnd = jest.fn();
		const { result, rerender } = renderHook(
			( { value }: { value: number } ) =>
				useDeferredCommit( {
					value,
					range: RANGE,
					commitStep: 1,
					onCommit,
					onCommitEnd,
				} ),
			{ initialProps: { value: 100 } }
		);

		act( () => result.current.onFocus() );
		rerender( { value: 200 } );
		act( () => result.current.onKeyDown( fakeKeyboardEvent( 'Enter' ) ) );

		expect( result.current.value ).toBe( '200' );
		expect( onCommit ).not.toHaveBeenCalled();
		expect( onCommitEnd ).not.toHaveBeenCalled();
	} );

	it( 'fires onSessionStart on focus and onSessionEnd on blur', () => {
		const onSessionStart = jest.fn();
		const onSessionEnd = jest.fn();
		const { result } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit: jest.fn(),
				onSessionStart,
				onSessionEnd,
			} )
		);

		act( () => result.current.onFocus() );
		expect( onSessionStart ).toHaveBeenCalledTimes( 1 );
		expect( onSessionEnd ).not.toHaveBeenCalled();

		act( () => result.current.onChange( '250' ) );
		expect( onSessionStart ).toHaveBeenCalledTimes( 1 );
		expect( onSessionEnd ).not.toHaveBeenCalled();

		act( () => result.current.onBlur() );
		expect( onSessionEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ 'Enter', 'Escape' ] as const )(
		'fires onSessionEnd exactly once on %s (not again from the resulting blur)',
		( key ) => {
			const onSessionEnd = jest.fn();
			const { result } = renderHook( () =>
				useDeferredCommit( {
					value: 100,
					range: RANGE,
					commitStep: 1,
					onCommit: jest.fn(),
					onSessionEnd,
				} )
			);

			act( () => result.current.onFocus() );
			act( () => result.current.onChange( '250' ) );
			act( () => result.current.onKeyDown( fakeKeyboardEvent( key ) ) );
			act( () => result.current.onBlur() );

			expect( onSessionEnd ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'ends an active session before flushing a pending live commit on unmount', () => {
		const onCommitEnd = jest.fn();
		const onSessionEnd = jest.fn();
		const { result, unmount } = renderHook( () =>
			useDeferredCommit( {
				value: 100,
				range: RANGE,
				commitStep: 1,
				onCommit: jest.fn(),
				onCommitEnd,
				onSessionEnd,
			} )
		);

		act( () => result.current.onFocus() );
		act( () => result.current.onChange( '250' ) );
		unmount();

		expect( onCommitEnd ).toHaveBeenCalledTimes( 1 );
		expect( onSessionEnd ).toHaveBeenCalledTimes( 1 );
		expect( onSessionEnd.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			onCommitEnd.mock.invocationCallOrder[ 0 ]
		);
	} );
} );
