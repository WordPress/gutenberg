import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { BlockStatesControl } from '../states';

function registerNavigationLink( selectors: BlockType[ 'selectors' ] ) {
	registerBlockType( 'core/navigation-link', {
		apiVersion: 3,
		title: 'Custom Link',
		category: 'design',
		attributes: {},
		edit: () => null,
		save: () => null,
		selectors,
	} );
}

describe( 'BlockStatesControl', () => {
	afterEach( () => {
		unregisterBlockType( 'core/navigation-link' );
	} );

	it( 'offers the Current state in an Item group', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		registerNavigationLink( {
			states: { '-current': '.wp-block-navigation .current-menu-item' },
		} );

		render(
			<BlockStatesControl
				name="core/navigation-link"
				value={ { custom: 'default', pseudo: 'default' } }
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: /State/ } ) );
		expect(
			screen.getByRole( 'group', { name: 'Item' } )
		).toBeInTheDocument();

		await user.click( screen.getByRole( 'menuitem', { name: 'Current' } ) );
		expect( onChange ).toHaveBeenCalledWith( { custom: '-current' } );
	} );

	it( 'does not offer the Current state when the block declares no selector for it', async () => {
		const user = userEvent.setup();
		registerNavigationLink( {} );

		render(
			<BlockStatesControl
				name="core/navigation-link"
				value={ { custom: 'default', pseudo: 'default' } }
				onChange={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: /State/ } ) );
		expect(
			screen.getByRole( 'group', { name: 'Pseudo state' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'group', { name: 'Item' } )
		).not.toBeInTheDocument();
	} );
} );
