/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useDialog from '..';

function Dialog( { onClose }: { onClose?: () => void } ) {
	const [ ref, props ] = useDialog( {
		onClose,
		focusOnMount: false,
	} );

	return (
		<div ref={ ref } { ...props } role="dialog" aria-label="Test dialog">
			<p>Dialog content</p>
			<button>Inside</button>
		</div>
	);
}

// `useDialog` currently detects the Escape key via the deprecated `keyCode`
// property (`event.keyCode === 27`). In jsdom, `userEvent.keyboard('[Escape]')`
// does not set `keyCode` to 27, so we use `fireEvent` to control the event
// shape. Once the hook is updated to use `event.key === 'Escape'`, these tests
// should be rewritten to use `userEvent` for more realistic event simulation.
function pressEscapeOn( element: HTMLElement ) {
	fireEvent.keyDown( element, { keyCode: 27, key: 'Escape' } );
}

describe( 'useDialog', () => {
	it( 'should call onClose when Escape is pressed', () => {
		const onClose = jest.fn();

		render( <Dialog onClose={ onClose } /> );

		pressEscapeOn( screen.getByRole( 'dialog' ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not call onClose when Escape is pressed if defaultPrevented', () => {
		const onClose = jest.fn();

		render( <Dialog onClose={ onClose } /> );

		const dialog = screen.getByRole( 'dialog' );
		const event = new KeyboardEvent( 'keydown', {
			keyCode: 27,
			bubbles: true,
			cancelable: true,
		} );
		event.preventDefault();
		dialog.dispatchEvent( event );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'should stop Escape event from propagating to parent elements', () => {
		const onClose = jest.fn();
		const parentKeyDownHandler = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ parentKeyDownHandler }>
				<Dialog onClose={ onClose } />
			</div>
		);

		pressEscapeOn( screen.getByRole( 'button', { name: 'Inside' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( parentKeyDownHandler ).not.toHaveBeenCalled();
	} );

	it( 'should let Escape propagate when there is no onClose handler', () => {
		const parentKeyDownHandler = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ parentKeyDownHandler }>
				<Dialog />
			</div>
		);

		pressEscapeOn( screen.getByRole( 'button', { name: 'Inside' } ) );

		expect( parentKeyDownHandler ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should close only the innermost dialog when nested', () => {
		const outerOnClose = jest.fn();
		const innerOnClose = jest.fn();

		function NestedDialogs() {
			const [ outerRef, outerProps ] = useDialog( {
				onClose: outerOnClose,
				focusOnMount: false,
			} );
			const [ innerRef, innerProps ] = useDialog( {
				onClose: innerOnClose,
				focusOnMount: false,
			} );

			return (
				<div
					ref={ outerRef }
					{ ...outerProps }
					role="dialog"
					aria-label="Outer"
				>
					<div
						ref={ innerRef }
						{ ...innerProps }
						role="dialog"
						aria-label="Inner"
					>
						<button>Focusable</button>
					</div>
				</div>
			);
		}

		render( <NestedDialogs /> );

		pressEscapeOn( screen.getByRole( 'button', { name: 'Focusable' } ) );

		expect( innerOnClose ).toHaveBeenCalledTimes( 1 );
		expect( outerOnClose ).not.toHaveBeenCalled();
	} );

	it( 'should not call onClose for non-Escape keys', () => {
		const onClose = jest.fn();

		render( <Dialog onClose={ onClose } /> );

		const dialog = screen.getByRole( 'dialog' );

		fireEvent.keyDown( dialog, { keyCode: 13, key: 'Enter' } );
		fireEvent.keyDown( dialog, { keyCode: 65, key: 'a' } );
		fireEvent.keyDown( dialog, { keyCode: 9, key: 'Tab' } );

		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
