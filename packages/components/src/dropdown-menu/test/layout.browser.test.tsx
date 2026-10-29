import { describe, expect, it, onTestFinished } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { more } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import DropdownMenu from '..';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import MenuItemsChoice from '../../menu-items-choice';
import '../../style.scss';

const centerY = ( element: Element ) => {
	const rect = element.getBoundingClientRect();
	return rect.top + rect.height / 2;
};

const textRect = ( label: string ) => {
	// Controls can render bare text. Measure that text rather than the button.
	const walker = document.createTreeWalker(
		screen.getByText( label ),
		NodeFilter.SHOW_TEXT
	);
	let node = walker.nextNode();
	while ( node && node.textContent !== label ) {
		node = walker.nextNode();
	}
	const range = document.createRange();
	range.selectNodeContents( node! );
	return range.getBoundingClientRect();
};

describe( 'DropdownMenu row layout', () => {
	it( 'aligns mixed action and choice labels without moving explicit action icons', async () => {
		const user = userEvent.setup();
		await render(
			<DropdownMenu
				label="Open menu"
				controls={ [ { title: 'Control action' } ] }
			>
				{ () => (
					<>
						<MenuGroup label="Editor">
							<MenuItem>Plain action</MenuItem>
							<MenuItem icon={ more } iconPosition="right">
								Trailing icon
							</MenuItem>
							<MenuItemsChoice
								choices={ [
									{ value: 'visual', label: 'Visual editor' },
								] }
								value="visual"
								onSelect={ () => {} }
							/>
						</MenuGroup>
						<MenuGroup label="Actions">
							<MenuItem icon={ more } iconPosition="left">
								Leading icon
							</MenuItem>
							<MenuItem suffix={ <span>Draft</span> }>
								Custom suffix
							</MenuItem>
							<MenuItemsChoice
								choices={ [
									{ value: 'code', label: 'Code editor' },
								] }
								value="code"
								onSelect={ () => {} }
							/>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		);
		await user.click( screen.getByRole( 'button', { name: 'Open menu' } ) );

		const plain = screen
			.getByText( 'Plain action' )
			.getBoundingClientRect();
		expect( textRect( 'Control action' ).left ).toBe( plain.left );
		expect(
			screen.getByText( 'Trailing icon' ).getBoundingClientRect().left
		).toBe( plain.left );
		expect(
			screen.getByText( 'Visual editor' ).getBoundingClientRect().left
		).toBe( plain.left );
		const leading = screen
			.getByText( 'Leading icon' )
			.getBoundingClientRect();
		expect(
			screen.getByText( 'Custom suffix' ).getBoundingClientRect().left
		).toBe( leading.left );
		expect(
			screen.getByText( 'Code editor' ).getBoundingClientRect().left
		).toBe( leading.left );
		const trailingItem = screen.getByRole( 'menuitem', {
			name: 'Trailing icon',
		} );
		const leadingItem = screen.getByRole( 'menuitem', {
			name: 'Leading icon',
		} );
		// Decorative action icons have no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const trailingIcon = trailingItem.querySelector( 'svg' )!;
		// eslint-disable-next-line testing-library/no-node-access
		const leadingIcon = leadingItem.querySelector( 'svg' )!;
		expect( trailingIcon.getBoundingClientRect().left ).toBeGreaterThan(
			plain.right
		);
		expect( leadingIcon.getBoundingClientRect().right ).toBeLessThanOrEqual(
			leading.left
		);
	} );

	it( 'aligns marks and shortcuts with the title of a description', async () => {
		const { innerWidth, innerHeight } = window;
		onTestFinished( () => page.viewport( innerWidth, innerHeight ) );
		await page.viewport( 800, 600 );
		const user = userEvent.setup();
		await render(
			<DropdownMenu label="Open menu">
				{ () => (
					<MenuGroup>
						<MenuItemsChoice
							choices={ [
								{
									value: 'code',
									label: 'Code editor',
									info: 'Edit the source of your content.',
									shortcut: 'Ctrl+C',
								},
							] }
							value="code"
							onSelect={ () => {} }
						/>
						<MenuItem
							icon={ more }
							iconPosition="left"
							info="Additional details"
							shortcut="Ctrl+A"
						>
							Action description
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
		);
		await user.click( screen.getByRole( 'button', { name: 'Open menu' } ) );
		for ( const [ role, label ] of [
			[ 'menuitemradio', 'Code editor' ],
			[ 'menuitem', 'Action description' ],
		] ) {
			const item = screen.getByRole( role, {
				name: new RegExp( label ),
			} );
			// Decorative icons have no accessible role to query.
			// eslint-disable-next-line testing-library/no-node-access
			const icon = item.querySelector( 'svg' )!;
			expect( centerY( icon ) ).toBeCloseTo(
				centerY( screen.getByText( label ) ),
				1
			);
		}
		expect( centerY( screen.getByText( 'Ctrl+C' ) ) ).toBeCloseTo(
			centerY( screen.getByText( 'Code editor' ) ),
			1
		);
		expect( centerY( screen.getByText( 'Ctrl+A' ) ) ).toBeCloseTo(
			centerY( screen.getByText( 'Action description' ) ),
			1
		);
	} );

	it( 'aligns controls with and without icons while preserving selection state', async () => {
		const user = userEvent.setup();
		await render(
			<DropdownMenu
				label="Open menu"
				controls={ [
					{ title: 'Plain control' },
					{ title: 'Icon control', icon: more },
					{
						title: 'Active control',
						icon: more,
						role: 'menuitemradio',
						isActive: true,
					},
					{
						title: 'Inactive control',
						icon: 'admin-generic',
						role: 'menuitemradio',
						isActive: false,
					},
				] }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Open menu' } ) );
		const left = textRect( 'Plain control' ).left;
		for ( const label of [
			'Icon control',
			'Active control',
			'Inactive control',
		] ) {
			expect( textRect( label ).left ).toBe( left );
		}
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Active control' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Inactive control' } )
		).not.toBeChecked();
	} );
} );
