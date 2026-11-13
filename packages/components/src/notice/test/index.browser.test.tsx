import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import Notice from '..';
import type { NoticeProps } from '../types';

async function renderWithActions( actions: NoticeProps[ 'actions' ] ) {
	const view = await render(
		<Notice isDismissible={ false } spokenMessage="" actions={ actions }>
			Message
		</Notice>
	);
	return async ( nextActions: NoticeProps[ 'actions' ] ) =>
		view.rerender(
			<Notice
				isDismissible={ false }
				spokenMessage=""
				actions={ nextActions }
			>
				Message
			</Notice>
		);
}

describe( 'Notice action identity', () => {
	it( 'keeps an identified action and its current callback after reordering', async () => {
		const user = userEvent.setup();
		const previous = vi.fn();
		const current = vi.fn();
		const update = await renderWithActions( [
			{ label: 'First', onClick: vi.fn() },
			{ id: '0', label: 'Second', onClick: previous },
		] );
		await user.tab();
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Second' } )
		).toHaveFocus();

		await update( [
			{ id: '0', label: 'Updated second', onClick: current },
			{ label: 'First', onClick: vi.fn() },
		] );
		expect(
			screen.getByRole( 'button', { name: 'Updated second' } )
		).toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( current ).toHaveBeenCalledTimes( 1 );
		expect( previous ).not.toHaveBeenCalled();
	} );

	it( 'does not focus or activate an unrelated replacement action', async () => {
		const user = userEvent.setup();
		const replacement = vi.fn();
		const update = await renderWithActions( [
			{ label: 'First', onClick: vi.fn() },
			{ id: 'second', label: 'Second', onClick: vi.fn() },
		] );
		await user.tab();
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Second' } )
		).toHaveFocus();

		await update( [
			{ label: 'First', onClick: vi.fn() },
			{ id: 'third', label: 'Third', onClick: replacement },
		] );
		expect(
			screen.getByRole( 'button', { name: 'Third' } )
		).not.toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( replacement ).not.toHaveBeenCalled();
	} );
} );
