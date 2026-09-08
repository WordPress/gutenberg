import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockAlignmentUI from '../ui';
import { LayoutProvider } from '../../block-list/layout';

describe( 'BlockAlignmentUI', () => {
	const alignment = 'left';
	const onChange = vi.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'should match snapshot when controls are hidden', () => {
		const { container } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should match snapshot when controls are visible', () => {
		const { container } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should expand controls when toggled', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
			/>
		);

		expect(
			screen.queryByRole( 'menuitemradio', {
				name: /^Align \w+$/,
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Align block',
			} )
		);

		expect(
			screen.getAllByRole( 'menuitemradio', {
				name: /^Align \w+$/,
			} )
		).toHaveLength( 3 );

		// Cancel running effects, like delayed dropdown menu popover positioning.
		unmount();
	} );

	test( 'should call onChange with undefined, when the control is already active', async () => {
		const user = userEvent.setup();

		render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		const activeControl = screen.getByRole( 'button', {
			name: `Align ${ alignment }`,
			pressed: true,
		} );

		await user.click( activeControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	test( 'should call onChange with alignment value when the control is inactive', async () => {
		const user = userEvent.setup();

		render(
			<BlockAlignmentUI
				value={ alignment }
				onChange={ onChange }
				isToolbar
				isCollapsed={ false }
			/>
		);

		const inactiveControl = screen.getByRole( 'button', {
			name: 'Align center',
			pressed: false,
		} );

		await user.click( inactiveControl );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'center' );
	} );
} );

describe( 'BlockAlignmentUI unavailable alignments', () => {
	// The block supports every alignment; the default flow layout offers only
	// none/left/center/right, so wide and full are taken away by the parent.
	const controls = [ 'left', 'center', 'right', 'wide', 'full' ];
	const onChange = vi.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	async function openMenu() {
		const user = userEvent.setup();
		render(
			<BlockAlignmentUI onChange={ onChange } controls={ controls } />
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);
		return user;
	}

	test( 'lists them rather than omitting them, in their usual position', async () => {
		await openMenu();

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'None',
			'Wide widthNot available',
			'Full widthNot available',
			'Align left',
			'Align center',
			'Align right',
		] );
	} );

	test( 'marks them as disabled while keeping them reachable', async () => {
		await openMenu();

		const wide = screen.getByRole( 'menuitemradio', {
			name: /Wide width/,
		} );

		expect( wide ).toHaveAttribute( 'aria-disabled', 'true' );
		// `disabled` would remove it from the accessibility tree entirely,
		// taking the explanation with it.
		expect( wide ).toBeEnabled();
	} );

	test( 'does not change the alignment when one is chosen', async () => {
		const user = await openMenu();

		await user.click(
			screen.getByRole( 'menuitemradio', { name: /Full width/ } )
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );

	test( 'leaves the menu alone when the layout offers every alignment', async () => {
		const user = userEvent.setup();
		render(
			<LayoutProvider
				value={ {
					type: 'constrained',
					contentSize: '600px',
					wideSize: '1200px',
				} }
			>
				<BlockAlignmentUI onChange={ onChange } controls={ controls } />
			</LayoutProvider>
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);

		expect( screen.queryAllByText( 'Not available' ) ).toHaveLength( 0 );
		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'NoneMax 600px wide',
			'Wide widthMax 1200px wide',
			'Full width',
			'Align left',
			'Align center',
			'Align right',
		] );
	} );
} );

describe( 'BlockAlignmentUI with no available alignments', () => {
	// Group supports only wide and full, so a flow layout leaves it nothing.
	const controls = [ 'wide', 'full' ];
	const onChange = vi.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	test( 'still offers None alongside what the layout withholds', async () => {
		const user = userEvent.setup();
		render(
			<BlockAlignmentUI onChange={ onChange } controls={ controls } />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'None',
			'Wide widthNot available',
			'Full widthNot available',
		] );
	} );

	test( 'renders nothing when the layout places children itself', () => {
		const { container } = render(
			<LayoutProvider value={ { type: 'flex' } }>
				<BlockAlignmentUI onChange={ onChange } controls={ controls } />
			</LayoutProvider>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
