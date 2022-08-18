/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Guide from '../';

describe( 'Guide', () => {
	it( 'renders nothing when there are no pages', () => {
		render( <Guide pages={ [] } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders one page at a time', () => {
		render(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);

		expect( screen.queryByRole( 'dialog' ) ).toBeVisible();
		expect( screen.queryByText( 'Page 1' ) ).toBeVisible();
		expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
	} );

	it( 'hides back button and shows forward button on the first page', () => {
		render(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Previous' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Next' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Finish' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows back button and shows finish button on the last page', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		render(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );

		expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Page 2' ) ).toBeVisible();

		expect(
			screen.queryByRole( 'button', { name: 'Previous' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Next' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Finish' } )
		).toBeVisible();
	} );

	it( "doesn't display the page control if there is only one page", () => {
		render( <Guide pages={ [ { content: <p>Page 1</p> } ] } /> );
		expect(
			screen.queryByRole( 'list', { name: 'Guide controls' } )
		).not.toBeInTheDocument();
	} );

	it( 'calls onFinish when the finish button is clicked', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const onFinish = jest.fn();
		render(
			<Guide
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Finish' } ) );

		expect( onFinish ).toHaveBeenCalled();
	} );

	it( 'calls onFinish when the modal is closed', () => {
		const onFinish = jest.fn();
		render(
			<Guide
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);

		/**
		 * Workaround to trigger an Escape keypress event.
		 *
		 * @todo Remove this workaround in favor of userEvent.keyboard() or userEvent.type().
		 *
		 * This curently doesn't work:
		 *
		 * ```
		 * await user.keyboard( '[Escape]' );
		 * ```
		 *
		 * because the event sent has a `keyCode` of `0`.
		 *
		 * To fix this, we'll need to update the Modal component to work with `KeyboardEvent.code`.
		 *
		 * @see https://github.com/testing-library/user-event/issues/969
		 */
		fireEvent.keyDown( screen.getByRole( 'dialog' ), {
			key: 'Escape',
			keyCode: 27,
		} );

		expect( onFinish ).toHaveBeenCalled();
	} );
} );
