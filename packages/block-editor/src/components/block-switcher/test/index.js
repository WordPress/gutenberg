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
import { BlockSwitcher } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../../block-title/use-block-display-title', () =>
	jest.fn().mockReturnValue( 'Block Name' )
);

describe( 'BlockSwitcher', () => {
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
	const headingBlockType = {
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
	};
	const paragraphBlockType = {
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
	};

	beforeAll( () => {
		registerBlockType( 'core/heading', headingBlockType );
		registerBlockType( 'core/paragraph', paragraphBlockType );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/heading' );
		unregisterBlockType( 'core/paragraph' );
	} );

	test( 'should render switcher with block transforms', async () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [
				{
					name: 'core/heading',
					title: headingBlockType.title,
					frecency: 1,
				},
				{
					name: 'core/paragraph',
					title: paragraphBlockType.title,
					frecency: 1,
				},
			],
			blocks: [ headingBlock1 ],
			canRemove: true,
		} ) );
		const user = userEvent.setup();
		render( <BlockSwitcher clientIds={ [ headingBlock1.clientId ] } /> );
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
		const dropdown = screen.getByRole( 'menu', {
			name: 'Block Name',
		} );
		await waitFor( () => expect( dropdown ).toBeVisible() );
		const items = within( dropdown ).getAllByRole( 'menuitem' );
		expect( items ).toHaveLength( 2 );
		expect( items[ 0 ] ).toHaveTextContent( paragraphBlockType.title );
		expect( items[ 1 ] ).toHaveTextContent( headingBlockType.title );
	} );

	test( 'should render accessibly disabled block switcher when we have a single selected block without styles and we cannot remove it', () => {
		useSelect.mockImplementation( () => ( {
			blocks: [ headingBlock1 ],
			icon: copy,
			hasBlockStyles: false,
			canRemove: false,
		} ) );
		render( <BlockSwitcher clientIds={ [ headingBlock1.clientId ] } /> );
		const blockSwitcher = screen.getByRole( 'button', {
			name: 'Block Name',
		} );
		expect( blockSwitcher ).toBeEnabled();
		expect( blockSwitcher ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'should render message for no available transforms', async () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [],
			blocks: [ headingBlock1 ],
			icon: copy,
			canRemove: true,
		} ) );
		render( <BlockSwitcher clientIds={ [ headingBlock1.clientId ] } /> );
		const user = userEvent.setup();
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
		expect(
			screen.getByRole( 'menu', {
				name: 'Block Name',
			} )
		).toHaveTextContent( 'No transforms.' );
	} );
} );
