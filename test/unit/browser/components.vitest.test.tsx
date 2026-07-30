/**
 * External dependencies
 */
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

/**
 * Internal dependencies
 */
import { Composite } from '../../../packages/components/src/composite';
import Tooltip from '../../../packages/components/src/tooltip';

test( 'moves focus through a composite with real keyboard input', async () => {
	const user = userEvent.setup();
	await render(
		<>
			<button>Before</button>
			<Composite>
				<Composite.Item>Item 1</Composite.Item>
				<Composite.Item>Item 2</Composite.Item>
				<Composite.Item>Item 3</Composite.Item>
			</Composite>
			<button>After</button>
		</>
	);
	const before = page.getByRole( 'button', { name: 'Before' } );
	const firstItem = page.getByRole( 'button', { name: 'Item 1' } );
	const secondItem = page.getByRole( 'button', { name: 'Item 2' } );
	const after = page.getByRole( 'button', { name: 'After' } );

	await user.tab();
	await expect.element( before ).toHaveFocus();

	await user.tab();
	await expect.element( firstItem ).toHaveFocus();

	await user.keyboard( '{ArrowDown}' );
	await expect.element( secondItem ).toHaveFocus();

	await user.tab();
	await expect.element( after ).toHaveFocus();
} );

test( 'shows a portal tooltip through real pointer input', async () => {
	const user = userEvent.setup();
	const view = await render(
		<Tooltip delay={ 0 } text="Browser mode tooltip">
			<button>Tooltip anchor</button>
		</Tooltip>
	);
	const anchor = page.getByRole( 'button', {
		name: 'Tooltip anchor',
	} );
	const tooltip = page.getByRole( 'tooltip', {
		name: 'Browser mode tooltip',
	} );

	await expect.element( tooltip ).not.toBeInTheDocument();
	await user.hover( anchor );
	await expect.element( tooltip ).toBeVisible();
	await expect
		.element( anchor )
		.toHaveAttribute( 'aria-describedby', tooltip.element().id );

	expect( view.container.contains( tooltip.element() ) ).toBe( false );
} );
