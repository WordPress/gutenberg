/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Guide from '..';

const defaultProps = {
	onFinish: () => {},
	contentLabel: 'Arbitrary Content Label',
};

describe( 'Guide', () => {
	it( 'renders nothing when there are no pages', () => {
		render( <Guide { ...defaultProps } pages={ [] } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders one page at a time', () => {
		render(
			<Guide
				{ ...defaultProps }
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
				{ ...defaultProps }
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
		const user = userEvent.setup();
		render(
			<Guide
				{ ...defaultProps }
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
		render(
			<Guide
				{ ...defaultProps }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);
		expect(
			screen.queryByRole( 'list', { name: 'Guide controls' } )
		).not.toBeInTheDocument();
	} );

	it( 'calls onFinish when the finish button is clicked', async () => {
		const user = userEvent.setup();
		const onFinish = jest.fn();
		render(
			<Guide
				{ ...defaultProps }
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Finish' } ) );

		expect( onFinish ).toHaveBeenCalled();
	} );

	it( 'calls onFinish when the modal is closed', async () => {
		const user = userEvent.setup();
		const onFinish = jest.fn();
		render(
			<Guide
				{ ...defaultProps }
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);

		await user.keyboard( '[Escape]' );

		expect( onFinish ).toHaveBeenCalled();
	} );

	describe( 'page navigation', () => {
		it( 'renders an empty list when there are no pages', () => {
			render( <Guide { ...defaultProps } pages={ [] } /> );
			expect(
				screen.queryByRole( 'list', {
					name: 'Guide controls',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /page \d of \d/i,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'renders a button for each page', () => {
			render(
				<Guide
					{ ...defaultProps }
					pages={ [
						{ content: <p>Page 1</p> },
						{ content: <p>Page 2</p> },
						{ content: <p>Page 3</p> },
						{ content: <p>Page 4</p> },
					] }
				/>
			);
			const listContainer = screen.getByRole( 'list', {
				name: 'Guide controls',
			} );
			expect(
				within( listContainer ).getAllByRole( 'button', {
					name: /page \d of \d/i,
				} )
			).toHaveLength( 4 );
		} );

		it( 'sets the current page when a button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Guide
					{ ...defaultProps }
					pages={ [
						{ content: <p>Page 1</p> },
						{ content: <p>Page 2</p> },
						{ content: <p>Page 3</p> },
					] }
				/>
			);

			expect( screen.getByText( 'Page 1' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Page 2 of 3' } )
			);

			expect( screen.getByText( 'Page 2' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Page 3 of 3' } )
			);

			expect( screen.getByText( 'Page 3' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Page 1 of 3' } )
			);

			expect( screen.getByText( 'Page 1' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();
		} );

		it( 'allows navigating through the pages with the left and right arrows', async () => {
			const user = userEvent.setup();

			render(
				<Guide
					{ ...defaultProps }
					pages={ [
						{ content: <p>Page 1</p> },
						{ content: <p>Page 2</p> },
						{ content: <p>Page 3</p> },
					] }
				/>
			);

			expect( screen.getByText( 'Page 1' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowLeft]' );

			expect( screen.getByText( 'Page 1' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowRight]' );

			expect( screen.getByText( 'Page 2' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowRight]' );

			expect( screen.getByText( 'Page 3' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowRight]' );

			expect( screen.getByText( 'Page 3' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowLeft]' );

			expect( screen.getByText( 'Page 2' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();

			await user.keyboard( '[ArrowLeft]' );

			expect( screen.getByText( 'Page 1' ) ).toBeVisible();
			expect( screen.queryByText( 'Page 2' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page 3' ) ).not.toBeInTheDocument();
		} );
	} );
} );
