import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from '@wordpress/element';
import JustifyContentUI from '../ui';

test( 'lists every justification option by default', async () => {
	const user = userEvent.setup();
	const { unmount } = render(
		createElement( JustifyContentUI, {
			value: 'left',
			onChange: vi.fn(),
		} )
	);

	await user.click(
		screen.getByRole( 'button', { name: 'Change items justification' } )
	);

	expect(
		screen.getAllByRole( 'menuitem' ).map( ( item ) => item.textContent )
	).toEqual( [
		'Left',
		'Center',
		'Right',
		'Space between',
		'Space around',
		'Space evenly',
	] );

	// Cancel delayed popover positioning effects.
	unmount();
} );
