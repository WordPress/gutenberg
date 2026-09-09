import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import Disabled from '../';

describe( 'Disabled browser behavior', () => {
	it( 'blocks pointer events for descendants', () => {
		render(
			<Disabled>
				<button type="button">Disabled action</button>
			</Disabled>
		);

		expect(
			getComputedStyle(
				screen.getByRole( 'button', { name: 'Disabled action' } )
			).pointerEvents
		).toBe( 'none' );
	} );

	it( 'skips descendants during tab navigation', async () => {
		render(
			<>
				<Disabled>
					<button type="button">Disabled action</button>
				</Disabled>
				<button type="button">Next action</button>
			</>
		);

		await userEvent.tab();

		expect(
			screen.getByRole( 'button', { name: 'Next action' } )
		).toHaveFocus();
	} );
} );
