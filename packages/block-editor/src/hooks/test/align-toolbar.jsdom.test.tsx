import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import BlockControls from '../../components/block-controls';
import {
	BlockEditContextProvider,
	blockEditingModeKey,
	mayDisplayControlsKey,
} from '../../components/block-edit/context';
import { BlockEditorProvider } from '../../components/provider';
import align from '../align';

const AlignEdit = align.edit;

const TOP_LEVEL_LABEL = "Wide and full width aren't available at the top level";

/**
 * A theme offering both wide and full. Without one, those alignments were never
 * on the table and are not reported as withheld.
 */
const THEME_LAYOUT = { contentSize: '600px', wideSize: '1200px' };

describe( 'Align toolbar control at the top level', () => {
	beforeEach( () => {
		// Like Group: supports wide and full only.
		registerBlockType( 'test/wide-only', {
			apiVersion: 3,
			title: 'Wide only',
			category: 'design',
			attributes: {},
			supports: { align: [ 'wide', 'full' ] },
		} );
		registerBlockType( 'test/every-alignment', {
			apiVersion: 3,
			title: 'Every alignment',
			category: 'design',
			attributes: {},
			supports: { align: true },
		} );
		registerBlockType( 'test/container', {
			apiVersion: 3,
			title: 'Container',
			category: 'design',
			attributes: {},
			supports: { layout: true },
		} );
	} );

	afterEach( () => {
		unregisterBlockType( 'test/wide-only' );
		unregisterBlockType( 'test/every-alignment' );
		unregisterBlockType( 'test/container' );
	} );

	function renderAlignControl( {
		name,
		align: value,
		isNested = false,
		layout = THEME_LAYOUT,
	}: {
		name: string;
		align?: string;
		isNested?: boolean;
		layout?: Record< string, string >;
	} ) {
		const block = createBlock( name, value ? { align: value } : {} );
		const blocks = [
			isNested ? createBlock( 'test/container', {}, [ block ] ) : block,
		];

		return render(
			<BlockEditorProvider
				value={ blocks }
				settings={ {
					supportsLayout: true,
					__unstableIsBlockBasedTheme: true,
					__experimentalFeatures: { layout },
				} }
			>
				<BlockEditContextProvider
					value={ {
						name,
						isSelected: true,
						clientId: block.clientId,
						[ mayDisplayControlsKey ]: true,
						[ blockEditingModeKey ]: 'default',
					} }
				>
					<AlignEdit
						name={ name }
						align={ value }
						clientId={ block.clientId }
						setAttributes={ vi.fn() }
					/>
				</BlockEditContextProvider>
				<BlockControls.Slot group="block" />
			</BlockEditorProvider>
		);
	}

	it( 'shows a disabled control explaining why when no alignment is available', async () => {
		renderAlignControl( { name: 'test/wide-only' } );

		const button = await screen.findByRole( 'button', {
			name: TOP_LEVEL_LABEL,
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.queryByRole( 'button', { name: 'Align block' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the disabled control focusable so its tooltip can be reached', async () => {
		renderAlignControl( { name: 'test/wide-only', align: 'full' } );

		const button = await screen.findByRole( 'button', {
			name: TOP_LEVEL_LABEL,
		} );
		expect( button ).toBeEnabled();
		button.focus();
		expect( button ).toHaveFocus();
	} );

	it( 'renders nothing for the same block inside another block', () => {
		const { container } = renderAlignControl( {
			name: 'test/wide-only',
			isNested: true,
		} );

		expect(
			screen.queryByRole( 'button', { name: TOP_LEVEL_LABEL } )
		).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the theme does not offer wide or full', () => {
		const { container } = renderAlignControl( {
			name: 'test/wide-only',
			layout: {},
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'keeps the usual menu when some alignment is available', async () => {
		renderAlignControl( { name: 'test/every-alignment' } );

		expect(
			await screen.findByRole( 'button', { name: 'Align block' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: TOP_LEVEL_LABEL } )
		).not.toBeInTheDocument();
	} );
} );
