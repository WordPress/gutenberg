/**
 * External dependencies
 */
import { act, render, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { __privateControlledInnerBlocks as ControlledInnerBlocks } from '../index';
import withRegistryProvider from '../../provider/with-registry-provider';
import { store as blockEditorStore } from '../../../store';

jest.mock( '../../block-list', () => ( {
	BlockListItems: () => null,
} ) );

const TEMPLATE = [ [ 'test/test-block', { foo: 42 } ] ];

const TestWrapper = withRegistryProvider( ( props ) => {
	if ( props.setRegistry ) {
		props.setRegistry( props.registry );
	}
	return props.children ?? null;
} );

describe( 'ControlledInnerBlocks', () => {
	beforeAll( () => {
		registerBlockType( 'test/test-block', {
			apiVersion: 3,
			title: 'Test block',
			attributes: {
				foo: { type: 'number' },
			},
		} );
		// A container block declaring its template in block type metadata.
		registerBlockType( 'test/container', {
			apiVersion: 3,
			title: 'Test container',
			template: TEMPLATE,
		} );
	} );

	function renderControlled( { value, template } ) {
		const containerBlock = createBlock( 'test/container' );
		const onChange = jest.fn();
		const onInput = jest.fn();
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		const { rerender } = render(
			<TestWrapper setRegistry={ setRegistry } />
		);
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.resetBlocks( [ containerBlock ] );
		} );
		rerender(
			<TestWrapper setRegistry={ setRegistry }>
				<ControlledInnerBlocks
					clientId={ containerBlock.clientId }
					value={ value }
					onChange={ onChange }
					onInput={ onInput }
					template={ template }
				/>
			</TestWrapper>
		);

		return {
			containerBlock,
			onChange,
			onInput,
			getInnerBlocks: () =>
				registry
					.select( blockEditorStore )
					.getBlocks( containerBlock.clientId ),
		};
	}

	it( 'does not apply the block type template to controlled inner blocks', async () => {
		// Controlled content comes from an entity; block type scaffolding
		// must not apply, even when the controlled value is empty.
		const { onChange, onInput, getInnerBlocks } = renderControlled( {
			value: [],
		} );

		// Yield so template synchronization could run if it were going to.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		expect( getInnerBlocks() ).toHaveLength( 0 );
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'preserves a non-empty controlled value untouched by the block type template', async () => {
		const existingChild = createBlock( 'test/test-block', { foo: 7 } );
		const { onChange, onInput, getInnerBlocks } = renderControlled( {
			value: [ existingChild ],
		} );

		await waitFor( () => expect( getInnerBlocks() ).toHaveLength( 1 ) );

		const blocks = getInnerBlocks();
		expect( blocks[ 0 ].name ).toBe( 'test/test-block' );
		expect( blocks[ 0 ].attributes.foo ).toBe( 7 );
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'still applies a template passed as a prop once an empty controlled value has landed', async () => {
		const { onInput, getInnerBlocks } = renderControlled( {
			value: [],
			template: [ [ 'test/test-block', { foo: 11 } ] ],
		} );

		await waitFor( () => expect( getInnerBlocks() ).toHaveLength( 1 ) );

		const blocks = getInnerBlocks();
		expect( blocks[ 0 ].name ).toBe( 'test/test-block' );
		expect( blocks[ 0 ].attributes.foo ).toBe( 11 );
		// The template application syncs back to the controlling entity as
		// a non-persistent change.
		expect( onInput ).toHaveBeenCalled();
	} );
} );
