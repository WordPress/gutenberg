import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DefaultBlockAppender, { ZWNBSP } from '../';
import * as blockEditorActions from '../../../store/actions';
import * as blockEditorSelectors from '../../../store/selectors';
vi.mock( import( '../../../store/actions' ), async ( importOriginal ) => {
	const actions = await importOriginal();
	return {
		...actions,
		startTyping: vi.fn( actions.startTyping ),
	};
} );
vi.mock( import( '../../../store/selectors' ), async ( importOriginal ) => {
	const selectors = await importOriginal();
	return {
		...selectors,
		getBlockCount: vi.fn( selectors.getBlockCount ),
	};
} );

describe( 'DefaultBlockAppender', () => {
	it( 'should match snapshot', () => {
		const { container } = render( <DefaultBlockAppender /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should append a default block when input focused', async () => {
		const startTyping = vi.spyOn( blockEditorActions, 'startTyping' );
		const user = userEvent.setup();

		const { container } = render( <DefaultBlockAppender /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add default block' } )
		);

		expect( container ).toMatchSnapshot();

		// Called once for focusing and once for clicking.
		expect( startTyping ).toHaveBeenCalledTimes( 2 );
		expect( startTyping ).toHaveBeenCalledWith();
	} );

	it( 'should optionally show without prompt', async () => {
		blockEditorSelectors.getBlockCount.mockImplementation( () => 1 );
		const user = userEvent.setup();

		const { container } = render( <DefaultBlockAppender /> );

		const appender = screen.getByRole( 'button', {
			name: 'Add default block',
		} );

		await user.click( appender );

		expect( appender ).toContainHTML( ZWNBSP );

		expect( container ).toMatchSnapshot();
	} );
} );
