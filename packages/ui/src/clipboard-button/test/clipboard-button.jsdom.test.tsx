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

	it( 'respects custom render prop as handled by Button', () => {
		render(
			<ClipboardButton
				text="test text"
				variant="outline"
				disabled
				focusableWhenDisabled
				render={ <button data-testid="button" /> }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Copy' } );
		expect( button ).toHaveAttribute( 'data-testid', 'button' );
		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
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

	it( 'copies text from a function', async () => {
		const user = userEvent.setup();
		const writeTextMock = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();

		render( <ClipboardButton text={ () => 'computed text' } /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( writeTextMock ).toHaveBeenCalledWith( 'computed text' );
	} );

	it( 'calls onCopy after a successful copy', async () => {
		const user = userEvent.setup();
		const onCopy = vi.fn();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render( <ClipboardButton text="test text" onCopy={ onCopy } /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( onCopy ).toHaveBeenCalledWith( 'test text', true );
	} );

	it( 'does not call onCopy when copying fails', async () => {
		const user = userEvent.setup();
		const onCopy = vi.fn();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
			new Error()
		);

		render( <ClipboardButton text="test text" onCopy={ onCopy } /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( onCopy ).not.toHaveBeenCalled();
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

	it( 'does not show a tooltip when truly disabled', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ClipboardButton
					text="test text"
					disabled
					focusableWhenDisabled={ false }
				/>
			</TestProvider>
		);

		await user.hover( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect( screen.queryByText( 'Copy' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a tooltip when disabled by default', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ClipboardButton text="test text" disabled />
			</TestProvider>
		);

		await user.hover( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Copy' ) ).toBeVisible();
		} );
	} );

	it( 'renders a text label without an accessible copy name override', () => {
		render( <ClipboardButton text="test text">Copy link</ClipboardButton> );

		expect(
			screen.getByRole( 'button', { name: 'Copy link' } )
		).toBeVisible();
	} );

	it( 'renders icon and text together', () => {
		render(
			<ClipboardButton text="test text">
				<ClipboardButton.Icon />
				Copy link
			</ClipboardButton>
		);

		expect(
			screen.getByRole( 'button', { name: 'Copy link' } )
		).toBeVisible();
	} );

	it( 'keeps the copy accessible name when only ClipboardButton.Icon is provided', () => {
		render(
			<ClipboardButton text="test text">
				<ClipboardButton.Icon />
			</ClipboardButton>
		);

		expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toBeVisible();
	} );

	it( 'forwards the icon ref', () => {
		const ref = createRef< SVGSVGElement >();

		render(
			<ClipboardButton text="test text">
				<ClipboardButton.Icon ref={ ref } />
			</ClipboardButton>
		);

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );

	it( 'updates the visible label after a successful copy', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<ClipboardButton text="test text">
				<ClipboardButton.Label />
			</ClipboardButton>
		);

		expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toBeVisible();

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		expect(
			screen.getByRole( 'button', { name: 'Copied' } )
		).toBeVisible();
	} );

	it( 'restores the pending label after timeout', async () => {
		const user = userEvent.setup();
		vi.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();

		render(
			<ClipboardButton text="test text" timeout={ 10 }>
				<ClipboardButton.Label />
			</ClipboardButton>
		);

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Copied' } )
			).toBeVisible();
		} );

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', { name: 'Copy' } )
			).toBeVisible();
		} );
	} );

	it( 'throws when ClipboardButton.Icon is outside ClipboardButton', () => {
		expect( () => render( <ClipboardButton.Icon /> ) ).toThrow(
			'ClipboardButton.Icon: Missing parent <ClipboardButton>. Render <ClipboardButton.Icon> inside <ClipboardButton>.'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'throws when ClipboardButton.Label is outside ClipboardButton', () => {
		expect( () => render( <ClipboardButton.Label /> ) ).toThrow(
			'ClipboardButton.Label: Missing parent <ClipboardButton>. Render <ClipboardButton.Label> inside <ClipboardButton>.'
		);
		expect( console ).toHaveErrored();
	} );
} );
