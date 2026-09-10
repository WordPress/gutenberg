import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockAlignmentUI from '../ui';
import { LayoutProvider } from '../../block-list/layout';
import { BlockEditorProvider } from '../../provider';

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

/**
 * A theme offering both wide and full. Without one, those alignments were never
 * on the table and are not reported as withheld.
 */
const THEME_LAYOUT = { contentSize: '600px', wideSize: '1200px' };

function renderWithTheme( ui, layout = THEME_LAYOUT, settings = {} ) {
	return render(
		<BlockEditorProvider
			value={ [] }
			settings={ { __experimentalFeatures: { layout }, ...settings } }
		>
			{ ui }
		</BlockEditorProvider>
	);
}

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
		renderWithTheme(
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
		renderWithTheme(
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
		renderWithTheme(
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
		const { container } = renderWithTheme(
			<LayoutProvider value={ { type: 'flex' } }>
				<BlockAlignmentUI onChange={ onChange } controls={ controls } />
			</LayoutProvider>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );

describe( 'BlockAlignmentUI when the theme withholds alignments', () => {
	// A theme offering neither is curating its own options globally, so those
	// alignments stay hidden rather than being reported as unavailable.
	const controls = [ 'left', 'center', 'right', 'wide', 'full' ];
	const onChange = vi.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	async function openMenuForTheme( layout ) {
		const user = userEvent.setup();
		renderWithTheme(
			<BlockAlignmentUI onChange={ onChange } controls={ controls } />,
			layout
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);
	}

	function menuItems() {
		return screen
			.getAllByRole( 'menuitemradio' )
			.map( ( item ) => item.textContent );
	}

	test( 'hides both when the theme sets no layout at all', async () => {
		// No provider at all, so the store holds no global layout.
		const user = userEvent.setup();
		render(
			<BlockAlignmentUI onChange={ onChange } controls={ controls } />
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);

		expect( menuItems() ).toEqual( [
			'None',
			'Align left',
			'Align center',
			'Align right',
		] );
	} );

	test( 'hides Wide when the theme sets no wide size', async () => {
		await openMenuForTheme( { contentSize: '600px' } );

		expect( menuItems() ).toEqual( [
			'None',
			'Full widthNot available',
			'Align left',
			'Align center',
			'Align right',
		] );
	} );
} );

describe( 'BlockAlignmentUI on a theme without layout support', () => {
	// Classic themes opt into wide alignments with `add_theme_support`, which
	// arrives as the `alignWide` setting. There is no layout to withhold
	// anything, so the menu either offers wide and full or leaves them out.
	const controls = [ 'left', 'center', 'right', 'wide', 'full' ];
	const onChange = vi.fn();

	afterEach( () => {
		onChange.mockClear();
	} );

	async function openMenuWithAlignWide( alignWide ) {
		const user = userEvent.setup();
		renderWithTheme(
			<BlockAlignmentUI onChange={ onChange } controls={ controls } />,
			undefined,
			{ supportsLayout: false, alignWide }
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);
	}

	function menuItems() {
		return screen
			.getAllByRole( 'menuitemradio' )
			.map( ( item ) => item.textContent );
	}

	test( 'offers both when the theme supports wide alignments', async () => {
		await openMenuWithAlignWide( true );

		expect( screen.queryAllByText( 'Not available' ) ).toHaveLength( 0 );
		expect( menuItems() ).toEqual( [
			'None',
			'Align left',
			'Align center',
			'Align right',
			'Wide width',
			'Full width',
		] );
	} );

	test( 'hides both when the theme does not support wide alignments', async () => {
		await openMenuWithAlignWide( false );

		expect( menuItems() ).toEqual( [
			'None',
			'Align left',
			'Align center',
			'Align right',
		] );
	} );
} );

describe( 'BlockAlignmentUI constraint', () => {
	const controls = [ 'left', 'center', 'right', 'wide', 'full' ];
	const onChange = vi.fn();
	const onSelect = vi.fn();
	const constraint = {
		description: 'Its layout limits widths',
		action: { label: 'Select Group', onClick: onSelect },
	};

	afterEach( () => {
		onChange.mockClear();
		onSelect.mockClear();
	} );

	async function openMenu() {
		const user = userEvent.setup();
		renderWithTheme(
			<BlockAlignmentUI
				onChange={ onChange }
				controls={ controls }
				constraint={ constraint }
			/>
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Align block' } )
		);
		return user;
	}

	test( 'explains the constraint as the action description', async () => {
		await openMenu();

		// Hung off the item rather than a group heading, so it reads as one
		// thing with the action that resolves it.
		expect(
			screen.getByRole( 'menuitem', {
				name: `Select Group ${ constraint.description }`,
			} )
		).toBeInTheDocument();
	} );

	test( 'offers the action as a command, not an alignment choice', async () => {
		await openMenu();

		// `menuitem`, not `menuitemradio`, so it is not announced as an
		// alignment option alongside the real ones.
		expect(
			screen.getByRole( 'menuitem', { name: /Select Group/ } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitemradio', { name: /Select Group/ } )
		).not.toBeInTheDocument();
	} );

	test( 'runs the action without changing the alignment', async () => {
		const user = await openMenu();

		await user.click(
			screen.getByRole( 'menuitem', { name: /Select Group/ } )
		);

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
