import { describe, expect, it, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { ClipboardButton } from '../index';
import * as Tooltip from '../../tooltip';

function TestProvider( { children }: { children: React.ReactNode } ) {
	return <Tooltip.Provider delay={ 0 }>{ children }</Tooltip.Provider>;
}

describe( 'ClipboardButton', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <ClipboardButton ref={ ref } text="test text" /> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'copies text when clicked', async () => {
		const user = userEvent.setup();
		const writeTextMock = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		render( <ClipboardButton text="test text" /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( writeTextMock ).toHaveBeenCalledWith( 'test text' );
	} );

	it( 'shows the copy label in the tooltip on hover', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ClipboardButton text="test text" />
			</TestProvider>
		);

		await user.hover( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Copy' ) ).toBeVisible();
		} );
	} );

	it( 'shows the copied label in the tooltip after a successful copy', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<TestProvider>
				<ClipboardButton text="test text" />
			</TestProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Copy' } );
		await user.hover( button );
		await user.click( button );

		await waitFor( () => {
			expect( screen.getByText( 'Copied!' ) ).toBeVisible();
		} );
	} );

	it( 'uses custom tooltip labels', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<TestProvider>
				<ClipboardButton
					text="test text"
					tooltipInitialText="Copy permalink"
					tooltipSuccessText="Permalink copied"
				/>
			</TestProvider>
		);

		const button = screen.getByRole( 'button', {
			name: 'Copy permalink',
		} );
		await user.hover( button );

		await waitFor( () => {
			expect( screen.getByText( 'Copy permalink' ) ).toBeVisible();
		} );

		await user.click( button );

		await waitFor( () => {
			expect( screen.getByText( 'Permalink copied' ) ).toBeVisible();
		} );
	} );

	it( 'does not show a tooltip when hasTooltip is false', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ClipboardButton text="test text" hasTooltip={ false } />
			</TestProvider>
		);

		await user.hover( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'renders children with the clipboard icon', () => {
		render( <ClipboardButton text="test text">Copy link</ClipboardButton> );

		expect(
			screen.getByRole( 'button', { name: 'Copy link' } )
		).toBeVisible();
	} );
} );
