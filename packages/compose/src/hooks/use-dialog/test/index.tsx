/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPortal } from 'react-dom';

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

describe( 'useDialog', () => {
	it( 'should call onClose when Escape is pressed', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();

		render( <Dialog onClose={ onClose } /> );

		screen.getByRole( 'dialog' ).focus();
		await user.keyboard( '[Escape]' );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not call onClose when Escape is pressed if defaultPrevented', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();

		function DialogWithChild() {
			const [ ref, props ] = useDialog( {
				onClose,
				focusOnMount: false,
			} );
			return (
				<div
					ref={ ref }
					{ ...props }
					role="dialog"
					aria-label="Test dialog"
				>
					<button
						onKeyDown={ ( event ) => {
							if ( event.key === 'Escape' ) {
								event.preventDefault();
							}
						} }
					>
						Inside
					</button>
				</div>
			);
		}

		render( <DialogWithChild /> );

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		await user.keyboard( '[Escape]' );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'should stop Escape event from propagating to parent elements', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const parentKeyDownHandler = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ parentKeyDownHandler }>
				<Dialog onClose={ onClose } />
			</div>
		);

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		await user.keyboard( '[Escape]' );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( parentKeyDownHandler ).not.toHaveBeenCalled();
	} );

	it( 'should let Escape propagate when there is no onClose handler', async () => {
		const user = userEvent.setup();
		const parentKeyDownHandler = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ parentKeyDownHandler }>
				<Dialog />
			</div>
		);

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		await user.keyboard( '[Escape]' );

		expect( parentKeyDownHandler ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not close when a portaled descendant handles Escape and stops propagation', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const descendantHandled = jest.fn();

		const portalTarget = document.createElement( 'div' );
		document.body.appendChild( portalTarget );

		function DialogWithPortaledChild() {
			const [ ref, props ] = useDialog( {
				onClose,
				focusOnMount: false,
			} );
			return (
				<div
					ref={ ref }
					{ ...props }
					role="dialog"
					aria-label="Test dialog"
				>
					{ createPortal(
						<button
							onKeyDown={ ( event ) => {
								if ( event.key === 'Escape' ) {
									descendantHandled();
									event.stopPropagation();
								}
							} }
						>
							Portaled
						</button>,
						portalTarget
					) }
				</div>
			);
		}

		render( <DialogWithPortaledChild /> );

		screen.getByText( 'Portaled' ).focus();
		await user.keyboard( '[Escape]' );

		expect( descendantHandled ).toHaveBeenCalledTimes( 1 );
		expect( onClose ).not.toHaveBeenCalled();

		document.body.removeChild( portalTarget );
	} );

	it( 'should close only the innermost dialog when nested', async () => {
		const user = userEvent.setup();
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

		screen.getByRole( 'button', { name: 'Focusable' } ).focus();
		await user.keyboard( '[Escape]' );

		expect( innerOnClose ).toHaveBeenCalledTimes( 1 );
		expect( outerOnClose ).not.toHaveBeenCalled();
	} );

	it( 'should call the consumer-provided onKeyDown alongside close-on-Escape', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const consumerOnKeyDown = jest.fn();

		function DialogWithConsumerOnKeyDown() {
			const [ ref, props ] = useDialog( {
				onClose,
				onKeyDown: consumerOnKeyDown,
				focusOnMount: false,
			} );
			return (
				<div
					ref={ ref }
					{ ...props }
					role="dialog"
					aria-label="Test dialog"
				/>
			);
		}

		render( <DialogWithConsumerOnKeyDown /> );

		screen.getByRole( 'dialog' ).focus();
		await user.keyboard( '[Escape]' );

		expect( consumerOnKeyDown ).toHaveBeenCalledTimes( 1 );
		expect( consumerOnKeyDown.mock.calls[ 0 ][ 0 ].key ).toBe( 'Escape' );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should let the consumer-provided onKeyDown opt out of close-on-Escape via preventDefault', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();

		function DialogOptingOut() {
			const [ ref, props ] = useDialog( {
				onClose,
				onKeyDown: ( event ) => event.preventDefault(),
				focusOnMount: false,
			} );
			return (
				<div
					ref={ ref }
					{ ...props }
					role="dialog"
					aria-label="Test dialog"
				/>
			);
		}

		render( <DialogOptingOut /> );

		screen.getByRole( 'dialog' ).focus();
		await user.keyboard( '[Escape]' );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'should not call onClose for non-Escape keys', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();

		render( <Dialog onClose={ onClose } /> );

		screen.getByRole( 'dialog' ).focus();
		await user.keyboard( '[Enter]' );
		await user.keyboard( 'a' );
		await user.keyboard( '[Tab]' );

		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
