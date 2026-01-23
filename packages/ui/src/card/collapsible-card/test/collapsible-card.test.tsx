import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleCard } from '../index';

describe( 'CollapsibleCard', () => {
	it( 'renders the title, summary, and content', () => {
		render(
			<CollapsibleCard title="Card title" summary="Card summary" open>
				<div>Content</div>
			</CollapsibleCard>
		);

		expect( screen.getByText( 'Card title' ) ).toBeVisible();
		expect( screen.getByText( 'Card summary' ) ).toBeVisible();
		expect( screen.getByText( 'Content' ) ).toBeVisible();
	} );

	it( 'calls onOpenChange when toggled', async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();

		render(
			<CollapsibleCard
				title="Card title"
				onOpenChange={ onOpenChange }
				open={ false }
			>
				<div>Content</div>
			</CollapsibleCard>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Toggle content',
		} );

		await user.click( trigger );
		expect( onOpenChange ).toHaveBeenCalledWith( true );
		expect( screen.getByText( 'Content' ) ).not.toBeVisible();

		await user.click( trigger );
		expect( screen.getByText( 'Content' ) ).toBeVisible();
	} );
} );
