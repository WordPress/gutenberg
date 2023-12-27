/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender, ZWNBSP } from '../';

describe( 'DefaultBlockAppender', () => {
	it( 'should match snapshot', () => {
		const onAppend = jest.fn();

		const { container } = render(
			<DefaultBlockAppender onAppend={ onAppend } showPrompt />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should append a default block when input focused', async () => {
		const user = userEvent.setup();
		const onAppend = jest.fn();

		const { container } = render(
			<DefaultBlockAppender onAppend={ onAppend } showPrompt />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add default block' } )
		);

		expect( container ).toMatchSnapshot();

		// Called once for focusing and once for clicking.
		expect( onAppend ).toHaveBeenCalledTimes( 2 );
		expect( onAppend ).toHaveBeenCalledWith();
	} );

	it( 'should optionally show without prompt', async () => {
		const user = userEvent.setup();
		const onAppend = jest.fn();

		const { container } = render(
			<DefaultBlockAppender onAppend={ onAppend } showPrompt={ false } />
		);

		const appender = screen.getByRole( 'button', {
			name: 'Add default block',
		} );

		await user.click( appender );

		expect( appender ).toContainHTML( ZWNBSP );

		expect( container ).toMatchSnapshot();
	} );
} );
