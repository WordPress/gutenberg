import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { Badge } from '../badge';
import * as Popover from '../../popover';

const infotip = (
	<Popover.Popup>
		<Popover.Title>Domain requirements</Popover.Title>
		<Popover.Description>A local address is required.</Popover.Description>
	</Popover.Popup>
);

describe( 'Badge', () => {
	it( 'keeps badges without infotips static and forwards their custom render and ref', () => {
		const ref = createRef< HTMLSpanElement >();
		render(
			<Badge ref={ ref } render={ <strong /> } data-label="status">
				Active
			</Badge>
		);

		expect( ref.current ).toBe( screen.getByText( 'Active' ) );
		expect( ref.current?.tagName ).toBe( 'STRONG' );
		expect( ref.current ).toHaveAttribute( 'data-label', 'status' );
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'makes the whole badge the infotip trigger while preserving custom rendering, props, and refs', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLButtonElement >();
		const onClick = vi.fn();
		const onSubmit = vi.fn();
		render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					onSubmit();
				} }
			>
				<Badge
					ref={ ref }
					render={ <button data-custom="badge" /> }
					infotip={ { popover: Popover, popup: infotip } }
					onClick={ onClick }
				>
					Special requirements
				</Badge>
			</form>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Special requirements',
		} );
		expect( ref.current ).toBe( trigger );
		expect( trigger ).toHaveAttribute( 'data-custom', 'badge' );

		await user.click( screen.getByText( 'Special requirements' ) );
		expect(
			await screen.findByRole( 'dialog', { name: 'Domain requirements' } )
		).toHaveTextContent( 'A local address is required.' );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
		expect( onSubmit ).not.toHaveBeenCalled();
	} );
} );
