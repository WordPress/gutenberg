/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import IsolatedEventContainer from '../';

describe( 'IsolatedEventContainer', () => {
	it( 'should pass props to container', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const clickHandler = jest.fn();
		render(
			<IsolatedEventContainer
				data-testid="container"
				className="test"
				onClick={ clickHandler }
			/>
		);

		const container = screen.getByTestId( 'container' );
		expect( container ).toHaveClass( 'test' );

		await user.click( container );

		expect( clickHandler ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveWarned();
	} );

	it( 'should render children', async () => {
		render(
			<IsolatedEventContainer data-testid="container">
				<p data-testid="child" />
			</IsolatedEventContainer>
		);

		expect(
			within( screen.getByTestId( 'container' ) ).getByTestId( 'child' )
		).toBeVisible();
	} );

	it( 'should stop mousedown event propagation', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		const mousedownHandler = jest.fn();
		const keydownHandler = jest.fn();
		render(
			<button
				onMouseDown={ mousedownHandler }
				onKeyDown={ keydownHandler }
			>
				<IsolatedEventContainer data-testid="container" />
			</button>
		);

		const container = screen.getByTestId( 'container' );

		await user.click( container );
		await user.keyboard( '[Enter]' );

		expect( mousedownHandler ).not.toHaveBeenCalled();
		expect( keydownHandler ).toHaveBeenCalledTimes( 1 );
	} );
} );
