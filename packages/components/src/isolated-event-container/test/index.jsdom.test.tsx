import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { logged } from '@wordpress/deprecated';
import IsolatedEventContainer from '..';

const DEPRECATION_MESSAGE =
	'wp.components.IsolatedEventContainer is deprecated since version 5.7.';

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

afterEach( () => {
	delete logged[ DEPRECATION_MESSAGE ];
} );

describe( 'IsolatedEventContainer', () => {
	it( 'should pass props to container', async () => {
		delete logged[ DEPRECATION_MESSAGE ];
		const user = userEvent.setup();
		const clickHandler = vi.fn();
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

		const mousedownHandler = vi.fn();
		const keydownHandler = vi.fn();
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
