/**
 * External dependencies
 */
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { copy } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { BlockSwitcher, BlockSwitcherDropdownMenu } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../../block-title/use-block-display-title', () =>
	jest.fn().mockReturnValue( 'Block Name' )
);

describe( 'BlockSwitcher', () => {
	test( 'should not render block switcher without blocks', () => {
		useSelect.mockImplementation( () => ( {} ) );
		const { container } = render( <BlockSwitcher /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should not render block switcher with null blocks', () => {
		useSelect.mockImplementation( () => ( { blocks: [ null ] } ) );
		const { container } = render(
			<BlockSwitcher
				clientIds={ [ 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9' ] }
			/>
		);
		expect( container ).toBeEmptyDOMElement();
	} );
} );
describe( 'BlockSwitcherDropdownMenu', () => {
	const headingBlock1 = {
		attributes: {
			content: [ 'How are you?' ],
			level: 2,
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h2>How are you?</h2>',
		clientId: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
	};

	const textBlock = {
		attributes: {
			content: [ 'I am great!' ],
		},
		isValid: true,
		name: 'core/paragraph',
		originalContent: '<p>I am great!</p>',
		clientId: 'b1303fdb-3e60-43faf-a770-2e1ea656c5b8',
	};

	const headingBlock2 = {
		attributes: {
			content: [ 'I am the greatest!' ],
			level: 3,
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h3>I am the greatest!</h3>',
		clientId: 'c2403fd2-4e63-5ffa-b71c-1e0ea656c5b0',
	};

	beforeAll( () => {
		registerBlockType( 'core/heading', {
			category: 'text',
			title: 'Heading',
			edit: () => {},
			save: () => {},
			transforms: {
				to: [
					{
						type: 'block',
						blocks: [ 'core/paragraph' ],
						transform: () => {},
					},
					{
						type: 'block',
						blocks: [ 'core/paragraph' ],
						transform: () => {},
						isMultiBlock: true,
					},
				],
			},
		} );

		registerBlockType( 'core/paragraph', {
			category: 'text',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
			transforms: {
				to: [
					{
						type: 'block',
						blocks: [ 'core/heading' ],
						transform: () => {},
					},
				],
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/heading' );
		unregisterBlockType( 'core/paragraph' );
	} );

	test( 'should render switcher with blocks', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [
				{ name: 'core/heading', frecency: 1 },
				{ name: 'core/paragraph', frecency: 1 },
			],
			canRemove: true,
		} ) );
		const { container } = render(
			<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render disabled block switcher with multi block of different types when no transforms', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [],
			icon: copy,
		} ) );
		const { container } = render(
			<BlockSwitcherDropdownMenu
				blocks={ [ headingBlock1, textBlock ] }
			/>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render enabled block switcher with multi block when transforms exist', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [
				{ name: 'core/heading', frecency: 1 },
				{ name: 'core/paragraph', frecency: 1 },
			],
			canRemove: true,
		} ) );
		const { container } = render(
			<BlockSwitcherDropdownMenu
				blocks={ [ headingBlock1, headingBlock2 ] }
			/>
		);
		expect( container ).toMatchSnapshot();
	} );

	describe( 'Dropdown', () => {
		beforeAll( () => {
			useSelect.mockImplementation( () => ( {
				possibleBlockTransformations: [
					{ name: 'core/paragraph', frecency: 3 },
				],
				canRemove: true,
			} ) );
		} );

		test( 'should dropdown exist', () => {
			render(
				<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} )
			).toBeVisible();
		} );

		test( 'should simulate a keydown event, which should open transform toggle.', async () => {
			const user = userEvent.setup();

			render(
				<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} )
			).toBeVisible();
			expect(
				screen.queryByRole( 'menu', {
					name: 'Block Name',
				} )
			).not.toBeInTheDocument();

			await user.type(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} ),
				'[ArrowDown]'
			);

			await waitFor( () =>
				expect(
					screen.getByRole( 'button', {
						name: 'Block Name',
						expanded: true,
					} )
				).toBeVisible()
			);

			await waitFor( () =>
				expect(
					screen.getByRole( 'menu', {
						name: 'Block Name',
					} )
				).toBeVisible()
			);
		} );

		test( 'should simulate a click event, which should call onToggle.', async () => {
			const user = userEvent.setup();

			render(
				<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} )
			).toBeVisible();
			expect(
				screen.queryByRole( 'menu', {
					name: 'Block Name',
				} )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} )
			);

			await waitFor( () =>
				expect(
					screen.getByRole( 'button', {
						name: 'Block Name',
						expanded: true,
					} )
				).toBeVisible()
			);

			await waitFor( () =>
				expect(
					screen.getByRole( 'menu', {
						name: 'Block Name',
					} )
				).toBeVisible()
			);
		} );

		test( 'should create the transform items for the chosen block.', async () => {
			const user = userEvent.setup();

			render(
				<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Block Name',
					expanded: false,
				} )
			);

			await waitFor( () =>
				expect(
					within(
						screen.getByRole( 'menu', {
							name: 'Block Name',
						} )
					).getByRole( 'menuitem' )
				).toBeInTheDocument()
			);
		} );
	} );
} );
