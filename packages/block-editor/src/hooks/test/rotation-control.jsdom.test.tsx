import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { SlotFillProvider } from '@wordpress/components';
import { dispatch, select, useDispatch, useSelect } from '@wordpress/data';
import {
	BlockEditContextProvider,
	mayDisplayControlsKey,
} from '../../components/block-edit/context';
import InspectorControls from '../../components/inspector-controls';
import PositionControls from '../../components/inspector-controls-tabs/position-controls-panel';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import rotate from '../rotation';

const BLOCK_NAME = 'test/rotate-control';

type BlockStyle = Record< string, unknown >;

type BlockAttributes = { style?: BlockStyle } | null;

function getStyle( clientId: string ) {
	return (
		select( blockEditorStore ).getBlockAttributes(
			clientId
		) as BlockAttributes
	 )?.style;
}

function RotateEdit( { clientId }: { clientId: string } ) {
	const style = useSelect(
		( selectStore ) =>
			(
				selectStore( blockEditorStore ).getBlockAttributes(
					clientId
				) as BlockAttributes
			 )?.style,
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const Edit = rotate.edit;
	return (
		<Edit
			clientId={ clientId }
			name={ BLOCK_NAME }
			style={ style }
			setAttributes={ ( attributes ) =>
				updateBlockAttributes( clientId, attributes )
			}
		/>
	);
}

function showRotateControl( style?: BlockStyle, hasPositionControl = false ) {
	const block = createBlock( BLOCK_NAME, { style } );
	// The block is selected, so its controls are displayed.
	const blockEditContext = {
		name: BLOCK_NAME,
		clientId: block.clientId,
		isSelected: true,
		[ mayDisplayControlsKey ]: true,
	};
	act( () => {
		dispatch( blockEditorStore ).resetBlocks( [ block ] );
		dispatch( blockEditorStore ).selectBlock( block.clientId );
	} );
	render(
		<SlotFillProvider>
			<BlockEditContextProvider value={ blockEditContext }>
				<RotateEdit clientId={ block.clientId } />
				{ hasPositionControl && (
					<InspectorControls group="position">
						<div>Position selector</div>
					</InspectorControls>
				) }
			</BlockEditContextProvider>
			<PositionControls />
		</SlotFillProvider>
	);
	return block.clientId;
}

describe( 'Rotation control', () => {
	beforeEach( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Rotate control test',
			category: 'text',
			attributes: { style: { type: 'object' } },
			supports: { rotation: true },
			edit: () => null,
			save: () => null,
		} );
	} );

	afterEach( () => {
		unregisterBlockType( BLOCK_NAME );
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
				'default'
			);
		} );
	} );

	it( 'shows and edits the default rotation', () => {
		const clientId = showRotateControl( { rotate: 15 } );

		const input = screen.getByRole( 'spinbutton', { name: 'Rotation' } );
		expect( input ).toHaveValue( 15 );

		fireEvent.change( input, { target: { value: '270' } } );
		expect( getStyle( clientId ) ).toEqual( { rotate: -90 } );

		fireEvent.change( input, { target: { value: '0' } } );
		expect( getStyle( clientId ) ).toBeUndefined();
	} );

	it( 'offers Rotation without a Position option when the block has no position control', () => {
		const clientId = showRotateControl();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		expect(
			screen.queryByRole( 'menuitem', { name: /Position,/ } )
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole( 'menuitemcheckbox', { name: 'Rotation, show' } )
		);
		fireEvent.change(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } ),
			{ target: { value: '45' } }
		);
		expect( getStyle( clientId ) ).toEqual( { rotate: 45 } );
	} );

	it( 'keeps the existing Position option alongside Rotation', () => {
		showRotateControl( { position: { type: 'sticky' } }, true );

		expect( screen.getByText( 'Position selector' ) ).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		expect(
			screen.getByRole( 'menuitem', {
				name: 'Position, reset to default',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Rotation, show' } )
		).toBeInTheDocument();
	} );

	it( 'hides Rotation without changing the existing position', () => {
		const clientId = showRotateControl(
			{ position: { type: 'sticky' }, rotate: 30 },
			true
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Rotation, hide and reset',
			} )
		);
		expect( getStyle( clientId ) ).toEqual( {
			position: { type: 'sticky' },
		} );
	} );

	it( 'resets Position without changing the existing rotation', () => {
		const clientId = showRotateControl(
			{ position: { type: 'sticky', top: '0px' }, rotate: 30 },
			true
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitem', {
				name: 'Position, reset to default',
			} )
		);
		expect( getStyle( clientId ) ).toEqual( { rotate: 30 } );
	} );

	it( 'edits the rotation of the selected viewport', () => {
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
				'@mobile'
			);
		} );
		const clientId = showRotateControl( {
			rotate: 15,
			'@mobile': { rotate: 30 },
		} );

		const input = screen.getByRole( 'spinbutton', { name: 'Rotation' } );
		expect( input ).toHaveValue( 30 );

		fireEvent.change( input, { target: { value: '0' } } );
		expect( getStyle( clientId ) ).toEqual( {
			rotate: 15,
			'@mobile': { rotate: 0 },
		} );
	} );

	it( 'resets only the rotation of the selected viewport', () => {
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
				'@mobile'
			);
		} );
		const clientId = showRotateControl( {
			rotate: 15,
			'@mobile': { rotate: 30 },
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitem', { name: 'Reset all' } )
		);

		expect( getStyle( clientId ) ).toEqual( { rotate: 15 } );
	} );

	it( 'resets Position and Rotation together without clearing other styles', () => {
		const clientId = showRotateControl(
			{
				position: { type: 'sticky', top: '0px' },
				rotate: 30,
				color: { text: 'red' },
			},
			true
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitem', { name: 'Reset all' } )
		);
		expect( getStyle( clientId ) ).toEqual( {
			color: { text: 'red' },
		} );
	} );

	it( 'resets both controls in the selected viewport without clearing desktop styles', () => {
		act( () => {
			unlock( dispatch( blockEditorStore ) ).setStyleStateViewport(
				'@mobile'
			);
		} );
		const clientId = showRotateControl(
			{
				rotate: 15,
				position: { type: 'sticky', top: '0px' },
				'@mobile': {
					rotate: 30,
					position: { type: 'fixed', top: '0px' },
					color: { text: 'red' },
				},
			},
			true
		);

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Position options' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitem', { name: 'Reset all' } )
		);
		expect( getStyle( clientId ) ).toEqual( {
			rotate: 15,
			position: { type: 'sticky', top: '0px' },
			'@mobile': {
				position: { type: '' },
				color: { text: 'red' },
			},
		} );
	} );
} );
