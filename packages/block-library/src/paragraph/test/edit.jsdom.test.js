import { beforeEach, describe, expect, test } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlock, registerBlockType, serialize } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { createElement, useEffect } from '@wordpress/element';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

let registry;
const OBSERVER_BLOCK = 'test/drop-cap-observer';

function RegistryObserver() {
	const blockRegistry = useRegistry();
	useEffect( () => {
		registry = blockRegistry;
	}, [ blockRegistry ] );
	return createElement( 'div', useBlockProps() );
}

async function setup( dropCap, isDropCapFeatureEnabled ) {
	await initializeEditor(
		[
			createBlock( 'core/paragraph', {
				content: 'A paragraph with existing content.',
				dropCap,
			} ),
			createBlock( OBSERVER_BLOCK ),
		],
		false,
		{
			__experimentalFeatures: {
				typography: { dropCap: isDropCapFeatureEnabled },
			},
		}
	);
	await selectBlock( 'Block: Paragraph' );
	const stylesTab = screen.queryByRole( 'tab', { name: 'Styles' } );
	if ( stylesTab ) {
		await userEvent.click( stylesTab );
	}
	expect(
		screen.getByRole( 'heading', { name: 'Typography' } )
	).toBeInTheDocument();
}

function getParagraph() {
	return registry.select( blockEditorStore ).getBlocks()[ 0 ];
}

describe( 'Paragraph drop cap', () => {
	beforeEach( () => {
		registerCoreBlocks();
		registerBlockType( OBSERVER_BLOCK, {
			apiVersion: 3,
			title: 'Registry observer',
			category: 'text',
			supports: { inserter: false, html: false },
			edit: RegistryObserver,
			save: () => null,
		} );
	} );

	test( 'can remove a saved drop cap when the active theme disables the feature', async () => {
		await setup( true, false );

		expect( serialize( getParagraph() ) ).toContain( 'has-drop-cap' );
		const control = screen.getByRole( 'checkbox', { name: 'Drop cap' } );
		expect( control ).toBeChecked();
		await userEvent.click( control );

		expect( getParagraph().attributes.dropCap ).toBe( false );
		expect( serialize( getParagraph() ) ).not.toContain( 'has-drop-cap' );
		expect(
			screen.queryByRole( 'checkbox', { name: 'Drop cap' } )
		).not.toBeInTheDocument();
	} );

	test( 'does not offer a new drop cap when the active theme disables the feature', async () => {
		await setup( false, false );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Typography options' } )
		);
		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: /^Drop cap/ } )
		).not.toBeInTheDocument();

		expect(
			screen.queryByRole( 'checkbox', { name: 'Drop cap' } )
		).not.toBeInTheDocument();
		expect( getParagraph().attributes.dropCap ).toBe( false );
		expect( serialize( getParagraph() ) ).not.toContain( 'has-drop-cap' );
	} );

	test( 'retains the drop cap control when the active theme enables the feature', async () => {
		await setup( true, true );

		const control = screen.getByRole( 'checkbox', { name: 'Drop cap' } );
		await userEvent.click( control );
		expect( getParagraph().attributes.dropCap ).toBe( false );
		expect( control ).not.toBeChecked();
		await userEvent.click( control );
		expect( getParagraph().attributes.dropCap ).toBe( true );
		expect( serialize( getParagraph() ) ).toContain( 'has-drop-cap' );
	} );

	test.each( [ true, false ] )(
		'does not offer drop caps in a selected style state when theme support is %s',
		async ( feature ) => {
			await setup( true, feature );
			const { clientId } = getParagraph();
			await act( async () => {
				unlock(
					registry.dispatch( blockEditorStore )
				).setSelectedBlockStyleState( clientId, { pseudo: ':hover' } );
			} );

			expect(
				registry
					.select( blockEditorStore )
					.hasSelectedBlockStyleState( clientId )
			).toBe( true );
			expect(
				screen.queryByRole( 'checkbox', { name: 'Drop cap' } )
			).not.toBeInTheDocument();
			expect( getParagraph().attributes.dropCap ).toBe( true );
		}
	);
} );
