import { describe, expect, it, onTestFinished } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import { check, more } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import DropdownMenu from '..';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import MenuItemsChoice from '../../menu-items-choice';
import { NavigableMenu } from '../../navigable-container';
import '../../style.scss';

const centerY = ( element: Element ) => {
	const rect = element.getBoundingClientRect();
	return rect.top + rect.height / 2;
};

const textLeft = ( label: string ) => {
	// Controls render bare text, so measure the label rather than its button.
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
	return range.getBoundingClientRect().left;
};

// Popover covers the opening animation; these fixtures measure the final layout.
describe( 'DropdownMenu row layout', () => {
	it( 'keeps leading selection labels and menu width stable when toggled', async () => {
		const CheckboxMenu = () => {
			const [ selected, setSelected ] = useState( true );
			return (
				<DropdownMenu
					defaultOpen
					label="Display options"
					popoverProps={ { animate: false } }
				>
					{ () => (
						<MenuGroup>
							<MenuItem
								role="menuitemcheckbox"
								isSelected={ selected }
								className="components-menu-item__selection-row"
								iconPosition="left"
								icon={ selected ? check : undefined }
								onClick={ () => setSelected( ! selected ) }
							>
								Show details
							</MenuItem>
							<MenuItem
								role="menuitemcheckbox"
								isSelected={ false }
								className="components-menu-item__selection-row"
								iconPosition="left"
							>
								Show outlines
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			);
		};
		const user = userEvent.setup();
		await render( <CheckboxMenu /> );
		const item = screen.getByRole( 'menuitemcheckbox', {
			name: 'Show details',
		} );
		await expect.element( item ).toBeVisible();
		// The decorative selection mark has no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = item.querySelector( 'svg' )!;
		await expect.element( indicator ).toBeVisible();
		const left = textLeft( 'Show details' );
		expect( textLeft( 'Show outlines' ) ).toBe( left );
		expect( indicator.getBoundingClientRect().right ).toBeLessThanOrEqual(
			left
		);
		const menu = screen.getByRole( 'menu' );
		const width = menu.getBoundingClientRect().width;
		await user.click( item );
		expect( item ).not.toBeChecked();
		// eslint-disable-next-line testing-library/no-node-access
		expect( item.querySelector( 'svg' ) ).toBeNull();
		expect( textLeft( 'Show details' ) ).toBe( left );
		expect( menu.getBoundingClientRect().width ).toBe( width );
	} );

	it( 'keeps selection marks inside standalone rows', async () => {
		await render(
			<NavigableMenu>
				<MenuItemsChoice
					choices={ [ { value: 'code', label: 'Code editor' } ] }
					value="code"
					onSelect={ () => {} }
				/>
			</NavigableMenu>
		);
		const item = screen.getByRole( 'menuitemradio', {
			name: 'Code editor',
		} );
		await expect.element( item ).toBeVisible();
		// The decorative selection mark has no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const icon = item.querySelector( 'svg' )!;
		expect( icon.getBoundingClientRect().left ).toBeGreaterThanOrEqual(
			item.getBoundingClientRect().left
		);
	} );

	it( 'preserves trailing checks and descriptions in custom menu items', async () => {
		await render(
			<DropdownMenu
				defaultOpen
				label="Editor"
				popoverProps={ { animate: false } }
			>
				{ () => (
					<MenuGroup>
						<MenuItemsChoice
							choices={ [
								{ value: 'code', label: 'Code editor' },
							] }
							value="code"
							onSelect={ () => {} }
						/>
						<MenuItem
							role="menuitemcheckbox"
							isSelected
							icon={ check }
							info="Keep the existing custom item layout."
						>
							Show details
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
		);
		const item = screen.getByRole( 'menuitemcheckbox', {
			name: /Show details/,
		} );
		await expect.element( item ).toBeVisible();
		// The decorative check has no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const icon = item.querySelector( 'svg' )!;
		expect( item ).toBeChecked();
		expect( icon.getBoundingClientRect().left ).toBeGreaterThan(
			textLeft( 'Show details' )
		);
		expect( centerY( icon ) ).toBeCloseTo( centerY( item ), 1 );
	} );

	it( 'keeps mixed row labels aligned when a choice changes', async () => {
		const MixedMenu = () => {
			const [ value, setValue ] = useState( 'visual' );
			return (
				<DropdownMenu
					defaultOpen
					popoverProps={ { animate: false } }
					label="Editor"
					controls={ [ { title: 'Control action' } ] }
				>
					{ () => (
						<>
							<MenuGroup>
								<MenuItem>Plain action</MenuItem>
								<MenuItemsChoice
									choices={ [
										{
											value: 'visual',
											label: 'Visual editor',
										},
										{ value: 'code', label: 'Code editor' },
									] }
									value={ value }
									onSelect={ setValue }
								/>
							</MenuGroup>
							<MenuGroup>
								<MenuItem icon={ more } iconPosition="left">
									Leading icon
								</MenuItem>
								<MenuItemsChoice
									choices={ [
										{
											value: 'other',
											label: 'Other choice',
										},
									] }
									value="other"
									onSelect={ () => {} }
								/>
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			);
		};
		const user = userEvent.setup();
		await render( <MixedMenu /> );
		const visual = screen.getByRole( 'menuitemradio', {
			name: 'Visual editor',
		} );
		const code = screen.getByRole( 'menuitemradio', {
			name: 'Code editor',
		} );
		// Decorative selection marks have no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const visualIcon = visual.querySelector( 'svg' )!;
		await expect.element( visualIcon ).toBeVisible();
		const left = textLeft( 'Plain action' );
		for ( const label of [
			'Visual editor',
			'Code editor',
			'Control action',
		] ) {
			expect( textLeft( label ) ).toBe( left );
		}
		expect( textLeft( 'Other choice' ) ).toBe( left );
		expect( textLeft( 'Leading icon' ) ).toBeGreaterThan( left );
		expect( visualIcon.getBoundingClientRect().right ).toBeLessThanOrEqual(
			left
		);

		await user.click( code );
		// eslint-disable-next-line testing-library/no-node-access
		expect( code.querySelector( 'svg' ) ).toBeVisible();
		// eslint-disable-next-line testing-library/no-node-access
		expect( visual.querySelector( 'svg' ) ).toBeNull();
		expect( textLeft( 'Visual editor' ) ).toBe( left );
		expect( textLeft( 'Code editor' ) ).toBe( left );
	} );

	it( 'aligns a selection mark and shortcut with its description title', async () => {
		const { innerWidth, innerHeight } = window;
		onTestFinished( () => page.viewport( innerWidth, innerHeight ) );
		await page.viewport( 800, 600 );
		await render(
			<DropdownMenu
				defaultOpen
				label="Editor"
				popoverProps={ { animate: false } }
			>
				{ () => (
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
				) }
			</DropdownMenu>
		);
		const item = screen.getByRole( 'menuitemradio', {
			name: /Code editor/,
		} );
		await expect.element( item ).toBeVisible();
		// The decorative selection mark has no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const icon = item.querySelector( 'svg' )!;
		const titleCenter = centerY( screen.getByText( 'Code editor' ) );
		expect( centerY( icon ) ).toBeCloseTo( titleCenter, 1 );
		expect( centerY( screen.getByText( 'Ctrl+C' ) ) ).toBeCloseTo(
			titleCenter,
			1
		);
	} );
} );
