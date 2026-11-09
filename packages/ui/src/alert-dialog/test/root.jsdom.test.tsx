import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import * as AlertDialog from '..';
import type { RootProps } from '../types';

function TestDialog( {
	controlled,
	defaultOpen = false,
	onOpenChange,
	onConfirm,
}: Pick< RootProps, 'defaultOpen' | 'onOpenChange' | 'onConfirm' > & {
	controlled: boolean;
} ) {
	const [ open, setOpen ] = useState( defaultOpen );
	return (
		<AlertDialog.Root
			open={ controlled ? open : undefined }
			defaultOpen={ defaultOpen }
			onOpenChange={ ( nextOpen, details ) => {
				onOpenChange?.( nextOpen, details );
				if ( ! details.isCanceled ) {
					setOpen( nextOpen );
				}
			} }
			onConfirm={ onConfirm }
		>
			<AlertDialog.Trigger>Open</AlertDialog.Trigger>
			<AlertDialog.Popup title="Confirm action" />
		</AlertDialog.Root>
	);
}

describe.each( [ false, true ] )(
	'AlertDialog controlled=%s',
	( controlled ) => {
		it( 'keeps a canceled opening closed and allows a later opening', async () => {
			const user = userEvent.setup();
			const onOpenChange = vi
				.fn< NonNullable< RootProps[ 'onOpenChange' ] > >()
				.mockImplementationOnce( ( nextOpen, details ) =>
					details.cancel()
				);
			render(
				<TestDialog
					controlled={ controlled }
					onOpenChange={ onOpenChange }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			expect( onOpenChange ).toHaveBeenCalledWith(
				true,
				expect.anything()
			);
			expect(
				screen.queryByRole( 'alertdialog' )
			).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
		} );

		it.each( [ 'Cancel', 'Escape' ] )(
			'keeps a canceled %s dismissal open and usable',
			async ( dismissal ) => {
				const user = userEvent.setup();
				const onOpenChange = vi
					.fn< NonNullable< RootProps[ 'onOpenChange' ] > >()
					.mockImplementationOnce( ( nextOpen, details ) =>
						details.cancel()
					);
				render(
					<TestDialog
						controlled={ controlled }
						defaultOpen
						onOpenChange={ onOpenChange }
					/>
				);

				if ( dismissal === 'Cancel' ) {
					await user.click(
						screen.getByRole( 'button', { name: 'Cancel' } )
					);
				} else {
					await user.keyboard( '{Escape}' );
				}

				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.anything()
				);
				expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
				expect(
					screen.getByRole( 'button', { name: 'OK' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );
				expect(
					screen.getByRole( 'button', { name: 'Cancel' } )
				).not.toHaveAttribute( 'aria-disabled', 'true' );

				await user.click(
					screen.getByRole( 'button', { name: 'Cancel' } )
				);
				await waitFor( () =>
					expect(
						screen.queryByRole( 'alertdialog' )
					).not.toBeInTheDocument()
				);
			}
		);

		it( 'restores usable controls when closing after confirmation is canceled', async () => {
			const user = userEvent.setup();
			let resolve!: () => void;
			const promise = new Promise< void >( ( res ) => {
				resolve = res;
			} );
			const onOpenChange = vi
				.fn< NonNullable< RootProps[ 'onOpenChange' ] > >()
				.mockImplementationOnce( ( nextOpen, details ) =>
					details.cancel()
				);
			const onConfirm = vi.fn( () => promise );
			render(
				<TestDialog
					controlled={ controlled }
					defaultOpen
					onOpenChange={ onOpenChange }
					onConfirm={ onConfirm }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'OK' } ) );
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
			await act( async () => resolve() );

			expect( onOpenChange ).toHaveBeenCalledWith(
				false,
				expect.objectContaining( { reason: 'imperative-action' } )
			);
			expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'OK' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );
			expect(
				within(
					screen.getByRole( 'button', { name: 'OK' } )
				).queryByRole( 'presentation' )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' );

			await user.click( screen.getByRole( 'button', { name: 'OK' } ) );
			expect( onConfirm ).toHaveBeenCalledTimes( 2 );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'alertdialog' )
				).not.toBeInTheDocument()
			);
		} );

		it( 'blocks dismissal during pending confirmation and closes when it resolves', async () => {
			const user = userEvent.setup();
			let resolve!: () => void;
			const promise = new Promise< void >( ( res ) => {
				resolve = res;
			} );
			const onOpenChange = vi.fn();
			render(
				<TestDialog
					controlled={ controlled }
					defaultOpen
					onOpenChange={ onOpenChange }
					onConfirm={ () => promise }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'OK' } ) );
			await user.keyboard( '{Escape}' );
			expect( onOpenChange ).not.toHaveBeenCalled();
			expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toHaveAttribute( 'aria-disabled', 'true' );

			await act( async () => resolve() );
			expect( onOpenChange ).toHaveBeenCalledTimes( 1 );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'alertdialog' )
				).not.toBeInTheDocument()
			);
		} );
	}
);
