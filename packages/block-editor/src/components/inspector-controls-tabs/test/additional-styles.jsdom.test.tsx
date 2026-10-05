import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import {
	createRegistry,
	RegistryProvider,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import AdditionalStyles from '../additional-styles-panel';
import {
	BlockEditContextProvider,
	blockEditingModeKey,
	mayDisplayControlsKey,
} from '../../block-edit/context';
import { store as blockEditorStore } from '../../../store';
import customClassName from '../../../hooks/custom-class-name';
import customCSS from '../../../hooks/custom-css';

const BLOCK_NAME = 'test/additional-styles';
const ClassNameControl = customClassName.edit;
const CSSControl = customCSS.edit;

function SelectedBlockControls() {
	const block = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlock(),
		[]
	);
	return block ? <Controls block={ block } /> : null;
}

function Controls( { block }: { block: BlockInstance } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setAttributes = ( attributes: Record< string, unknown > ) =>
		updateBlockAttributes( block.clientId, attributes );
	return (
		<BlockEditContextProvider
			value={ {
				clientId: block.clientId,
				name: block.name,
				[ mayDisplayControlsKey ]: true,
				[ blockEditingModeKey ]: 'default',
			} }
		>
			<ClassNameControl
				clientId={ block.clientId }
				className={ block.attributes.className }
				setAttributes={ setAttributes }
			/>
			<CSSControl
				clientId={ block.clientId }
				name={ block.name }
				setAttributes={ setAttributes }
			/>
		</BlockEditContextProvider>
	);
}

function setup( attributes = {} ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const blocks = [
		createBlock( BLOCK_NAME, attributes ),
		createBlock( BLOCK_NAME ),
	];
	registry.dispatch( blockEditorStore ).resetBlocks( blocks );
	registry
		.dispatch( blockEditorStore )
		.updateSettings( { canEditCSS: true } );
	registry.dispatch( blockEditorStore ).selectBlock( blocks[ 0 ].clientId );
	render(
		<RegistryProvider value={ registry }>
			<SlotFillProvider>
				<SelectedBlockControls />
				<AdditionalStyles />
			</SlotFillProvider>
		</RegistryProvider>
	);
	return { registry, blocks, user: userEvent.setup() };
}

describe( 'Additional styles controls', () => {
	beforeEach( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Test block',
			category: 'text',
			attributes: {
				className: { type: 'string' },
				style: { type: 'object' },
			},
			save: () => null,
		} );
	} );

	afterEach( () => unregisterBlockType( BLOCK_NAME ) );

	it( 'reveals empty CSS controls from the Additional styles menu', async () => {
		const { user } = setup();
		expect(
			screen.queryByLabelText( 'CSS class(es)' )
		).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'CSS' ) ).not.toBeInTheDocument();
		await user.click(
			screen.getByRole( 'button', { name: 'Additional styles options' } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show CSS class(es)',
			} )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show CSS',
				exact: true,
			} )
		);
		expect( screen.getByLabelText( 'CSS class(es)' ) ).toBeVisible();
		expect( screen.getByLabelText( 'CSS' ) ).toBeVisible();
	} );

	it( 'shows CSS controls when values are set', () => {
		setup( { className: 'custom', style: { css: 'color: red;' } } );
		expect( screen.getByLabelText( 'CSS class(es)' ) ).toHaveValue(
			'custom'
		);
		expect( screen.getByLabelText( 'CSS' ) ).toHaveValue( 'color: red;' );
	} );

	it( 'resets additional styles without clearing unrelated block styles', async () => {
		const { registry, blocks, user } = setup( {
			className: 'custom',
			style: { css: 'color: red;', typography: { fontSize: '20px' } },
		} );
		await user.click(
			screen.getByRole( 'button', { name: 'Additional styles options' } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Hide and reset CSS',
				exact: true,
			} )
		);
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( blocks[ 0 ].clientId )
		).toEqual( {
			className: 'custom',
			style: { typography: { fontSize: '20px' } },
		} );
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show CSS',
				exact: true,
			} )
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Additional styles options' } )
		);
		await user.type( screen.getByLabelText( 'CSS' ), 'color: blue;' );
		await user.click(
			screen.getByRole( 'button', { name: 'Additional styles options' } )
		);
		await user.click(
			screen.getByRole( 'menuitem', { name: 'Reset all' } )
		);
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( blocks[ 0 ].clientId )
		).toEqual( {
			className: undefined,
			style: { typography: { fontSize: '20px' } },
		} );
	} );

	it( 'keeps control visibility scoped to the selected block', async () => {
		const { registry, blocks, user } = setup();
		await user.click(
			screen.getByRole( 'button', { name: 'Additional styles options' } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show CSS',
				exact: true,
			} )
		);
		expect( screen.getByLabelText( 'CSS' ) ).toBeVisible();
		await act( () =>
			registry
				.dispatch( blockEditorStore )
				.selectBlock( blocks[ 1 ].clientId )
		);
		expect( screen.queryByLabelText( 'CSS' ) ).not.toBeInTheDocument();
	} );
} );
