import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritingStyleDropdown from '../style-dropdown';

const HeadingIcon = () => <svg data-testid="heading-icon" />;
const ParagraphIcon = () => <svg data-testid="paragraph-icon" />;

const GROUPS = [
	{
		name: 'Bricolage Grotesque',
		fontFamily: '"Bricolage Grotesque", sans-serif',
		styles: [
			{
				key: 'core/heading:1',
				label: 'Heading 1',
				icon: HeadingIcon,
				blockName: 'core/heading',
				variation: 'h1',
				attributes: { level: 1 },
				fontFamily: '"Bricolage Grotesque", sans-serif',
				fontSize: '60px',
			},
			{
				key: 'core/heading:2',
				label: 'Heading 2',
				blockName: 'core/heading',
				variation: 'h2',
				attributes: { level: 2 },
				fontFamily: '"Bricolage Grotesque", sans-serif',
				fontSize: '40px',
			},
		],
	},
	{
		name: 'Instrument Sans',
		fontFamily: '"Instrument Sans", sans-serif',
		styles: [
			{
				key: 'core/paragraph',
				label: 'Paragraph',
				icon: ParagraphIcon,
				blockName: 'core/paragraph',
				fontFamily: '"Instrument Sans", sans-serif',
				fontSize: '17px',
			},
		],
	},
];

describe( 'WritingStyleDropdown', () => {
	it( 'shows the style the block is currently in', () => {
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/heading:2"
				onSelect={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Style' } )
		).toHaveTextContent( 'Heading 2' );
	} );

	it( 'lists every style, grouped by font', async () => {
		const user = userEvent.setup();
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/paragraph"
				onSelect={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Style' } ) );

		// Each font heads the styles set in it, and the styles follow in the
		// order the groups give them. MenuGroup hides its own heading from the
		// accessibility tree and names the group after it, so the heading is
		// asserted as text rather than as a visible element.
		expect( screen.getByText( 'Bricolage Grotesque' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Instrument Sans' ) ).toBeInTheDocument();
		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Heading 1', 'Heading 2', 'Paragraph' ] );
	} );

	it( 'marks the active style as chosen', async () => {
		const user = userEvent.setup();
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/heading:2"
				onSelect={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Style' } ) );

		expect(
			screen.getByRole( 'menuitemradio', { name: 'Heading 2' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Paragraph' } )
		).not.toBeChecked();
	} );

	it( 'previews each style in its own font and size', async () => {
		const user = userEvent.setup();
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/paragraph"
				onSelect={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Style' } ) );

		expect(
			screen.getByRole( 'menuitemradio', { name: 'Heading 1' } )
		).toHaveStyle( {
			fontFamily: '"Bricolage Grotesque", sans-serif',
			fontSize: '60px',
		} );
	} );

	it( 'shows each style’s block icon, as the transformations menu does', async () => {
		const user = userEvent.setup();
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/paragraph"
				onSelect={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Style' } ) );

		expect(
			within(
				screen.getByRole( 'menuitemradio', { name: 'Heading 1' } )
			).getByTestId( 'heading-icon' )
		).toBeInTheDocument();
		expect(
			within(
				screen.getByRole( 'menuitemradio', { name: 'Paragraph' } )
			).getByTestId( 'paragraph-icon' )
		).toBeInTheDocument();
	} );

	it( 'hands the chosen style back', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(
			<WritingStyleDropdown
				groups={ GROUPS }
				activeKey="core/paragraph"
				onSelect={ onSelect }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Style' } ) );
		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'Heading 1' } )
		);

		expect( onSelect ).toHaveBeenCalledWith(
			expect.objectContaining( { key: 'core/heading:1' } )
		);
	} );
} );
