/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { SlotFillProvider, ToolbarGroup } from '@wordpress/components';
import { alignCenter, alignLeft, alignRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockControls from '../';
import BlockEdit from '../../block-edit';

describe( 'BlockControls', () => {
	const controls = [
		{
			icon: alignLeft,
			title: 'Align left',
			align: 'left',
		},
		{
			icon: alignCenter,
			title: 'Align center',
			align: 'center',
		},
		{
			icon: alignRight,
			title: 'Align right',
			align: 'right',
		},
	];

	beforeEach( () => {
		const edit = ( { children } ) => <>{ children }</>;

		registerBlockType( 'core/test-block', {
			save: () => {},
			category: 'text',
			title: 'block title',
			edit,
		} );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should render a dynamic toolbar of controls', () => {
		render(
			<SlotFillProvider>
				<BlockEdit name="core/test-block" isSelected>
					<BlockControls controls={ controls }>
						<p>Child</p>
					</BlockControls>
				</BlockEdit>
				<BlockControls.Slot />
			</SlotFillProvider>
		);

		expect(
			screen.getAllByRole( 'button', { name: /^Align [\w]+/ } )
		).toHaveLength( controls.length );

		controls.forEach( ( { title, align } ) => {
			const control = screen.getByRole( 'button', {
				name: title,
			} );
			expect( control ).toBeVisible();
			expect( control ).toHaveAttribute( 'align', align );
		} );
	} );

	it( 'should render its children', () => {
		render(
			<SlotFillProvider>
				<BlockEdit name="core/test-block" isSelected>
					<BlockControls controls={ controls }>
						<p>Child</p>
					</BlockControls>
				</BlockEdit>
				<BlockControls.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Child' ) ).toBeVisible();
	} );

	it( 'should a dynamic toolbar when passed as children', () => {
		render(
			<SlotFillProvider>
				<BlockEdit name="core/test-block" isSelected>
					<BlockControls>
						<ToolbarGroup controls={ controls } />
					</BlockControls>
				</BlockEdit>
				<BlockControls.Slot />
			</SlotFillProvider>
		);

		expect(
			screen.getAllByRole( 'button', { name: /^Align [\w]+/ } )
		).toHaveLength( controls.length );

		controls.forEach( ( { title, align } ) => {
			const control = screen.getByRole( 'button', {
				name: title,
			} );
			expect( control ).toBeVisible();
			expect( control ).toHaveAttribute( 'align', align );
		} );
	} );
} );
