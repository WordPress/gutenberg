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
		const user = userEvent.setup();
		const clickHandler = jest.fn();
		render(
			<IsolatedEventContainer
				title="Container"
				className="test"
				onClick={ clickHandler }
			/>
		);

		const container = screen.getByTitle( 'Container' );
		expect( container ).toHaveClass( 'test' );

		await user.click( container );

		expect( clickHandler ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveWarned();
	} );

	it( 'should render children', async () => {
		render(
			<IsolatedEventContainer title="Container">
				<p>Child</p>
			</IsolatedEventContainer>
		);

		expect(
			within( screen.getByTitle( 'Container' ) ).getByText( 'Child' )
		).toBeVisible();
	} );

	it( 'should stop event propagation only for mousedown, but not for keydown', async () => {
		const user = userEvent.setup();

		const mousedownHandler = jest.fn();
		const keydownHandler = jest.fn();
		render(
			<button
				onMouseDown={ mousedownHandler }
				onKeyDown={ keydownHandler }
			>
				<IsolatedEventContainer title="Container" />
			</button>
		);

		const container = screen.getByTitle( 'Container' );

		await user.click( container );
		await user.keyboard( '[Enter]' );

		expect( mousedownHandler ).not.toHaveBeenCalled();
		expect( keydownHandler ).toHaveBeenCalledTimes( 1 );
	} );
} );
