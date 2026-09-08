import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyToClipboard } from '../index';

describe( 'CopyToClipboard', () => {
	it( 'copies text when the child is clicked', async () => {
		const user = userEvent.setup();
		const writeTextMock = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		render(
			<CopyToClipboard text="test text">
				<button type="button">Copy</button>
			</CopyToClipboard>
		);

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( writeTextMock ).toHaveBeenCalledTimes( 1 );
		expect( writeTextMock ).toHaveBeenCalledWith( 'test text' );
	} );

	it( 'exposes success status after copying', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<CopyToClipboard text="test text">
				{ ( status ) => <button type="button">{ status }</button> }
			</CopyToClipboard>
		);

		expect(
			screen.getByRole( 'button', { name: 'pending' } )
		).toBeVisible();

		await user.click( screen.getByRole( 'button' ) );

		expect(
			screen.getByRole( 'button', { name: 'success' } )
		).toBeVisible();
	} );

	it( 'restores pending status after timeout', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<CopyToClipboard text="test text" timeout={ 10 }>
				{ ( status ) => <button type="button">{ status }</button> }
			</CopyToClipboard>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect(
			screen.getByRole( 'button', { name: 'success' } )
		).toBeVisible();

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'pending' } )
			).toBeVisible();
		} );
	} );

	it( 'copies text from a function', async () => {
		const user = userEvent.setup();
		const writeTextMock = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		render(
			<CopyToClipboard text={ () => 'computed text' }>
				<button type="button">Copy</button>
			</CopyToClipboard>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( writeTextMock ).toHaveBeenCalledWith( 'computed text' );
	} );

	it( 'calls onCopy after a successful copy', async () => {
		const user = userEvent.setup();
		const onCopy = vi.fn();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<CopyToClipboard text="test text" onCopy={ onCopy }>
				<button type="button">Copy</button>
			</CopyToClipboard>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( onCopy ).toHaveBeenCalledTimes( 1 );
		expect( onCopy ).toHaveBeenCalledWith( 'test text', true );
	} );

	it( 'does not change status when copying fails', async () => {
		const user = userEvent.setup();
		const onCopy = vi.fn();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
			new Error()
		);

		render(
			<CopyToClipboard text="test text" onCopy={ onCopy }>
				{ ( status ) => <button type="button">{ status }</button> }
			</CopyToClipboard>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect(
			screen.getByRole( 'button', { name: 'pending' } )
		).toBeVisible();
		expect( onCopy ).not.toHaveBeenCalled();
	} );
} );
