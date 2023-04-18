/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useBlockSync from '../use-block-sync';
import withRegistryProvider from '../with-registry-provider';
import * as blockEditorActions from '../../../store/actions';

import { store as blockEditorStore } from '../../../store';
jest.mock( '../../../store/actions', () => {
	const actions = jest.requireActual( '../../../store/actions' );
	return {
		...actions,
		resetBlocks: jest.fn( actions.resetBlocks ),
		replaceInnerBlocks: jest.fn( actions.replaceInnerBlocks ),
		setHasControlledInnerBlocks: jest.fn( actions.replaceInnerBlocks ),
	};
} );

const TestWrapper = withRegistryProvider( ( props ) => {
	if ( props.setRegistry ) {
		props.setRegistry( props.registry );
	}
	useBlockSync( props );
	return <p>Test.</p>;
} );

describe( 'useBlockSync hook', () => {
	beforeAll( () => {
		registerBlockType( 'test/test-block', {
			title: 'Test block',
			attributes: {
				foo: { type: 'number' },
			},
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'resets the block-editor blocks when the controll value changes', async () => {
		const fakeBlocks = [];
		const resetBlocks = jest.spyOn( blockEditorActions, 'resetBlocks' );
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = jest.fn();
		const onInput = jest.fn();

		const { rerender } = render(
			<TestWrapper
				value={ fakeBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called on mount.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( resetBlocks ).toHaveBeenCalledWith( fakeBlocks );

		const testBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		rerender(
			<TestWrapper
				value={ testBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called when the incoming value changes.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( resetBlocks ).toHaveBeenCalledWith( testBlocks );
	} );

	it( 'replaces the inner blocks of a block when the control value changes if a clientId is passed', async () => {
		const fakeBlocks = [];
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const resetBlocks = jest.spyOn( blockEditorActions, 'resetBlocks' );
		const onChange = jest.fn();
		const onInput = jest.fn();

		const { rerender } = render(
			<TestWrapper
				clientId="test"
				value={ fakeBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		expect( resetBlocks ).not.toHaveBeenCalled();
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).toHaveBeenCalledWith(
			'test', // It should use the given client ID.
			fakeBlocks // It should use the controlled blocks value.
		);

		const testBlocks = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];
		rerender(
			<TestWrapper
				clientId="test"
				value={ testBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called when the incoming value changes.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( resetBlocks ).not.toHaveBeenCalled();
		// We can't check the args because the blocks are cloned.
		expect( replaceInnerBlocks ).toHaveBeenCalled();
	} );

	it( 'does not add the controlled blocks to the block-editor store if the store already contains them', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				clientId="test"
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		const newBlockValue = registry
			.select( blockEditorStore )
			.getBlocks( 'test' );
		replaceInnerBlocks.mockClear();

		// Assert that the reference has changed so that the side effect will be
		// triggered once more.
		expect( newBlockValue ).not.toBe( value1 );

		rerender(
			<TestWrapper
				clientId="test"
				value={ newBlockValue }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// replaceInnerBlocks should not be called when the controlling
		// block value is the same as what already exists in the store.
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
	} );

	it( 'sets a block as an inner block controller if a clientId is provided', async () => {
		const setAsController = jest.spyOn(
			blockEditorActions,
			'setHasControlledInnerBlocks'
		);

		render(
			<TestWrapper
				clientId="test"
				value={ [] }
				onChange={ jest.fn() }
				onInput={ jest.fn() }
			/>
		);
		expect( setAsController ).toHaveBeenCalledWith( 'test', true );
	} );

	it( 'calls onInput when a non-persistent block change occurs', async () => {
		const onChange = jest.fn();
		const onInput = jest.fn();
		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();

		// Create a non-persistent change.
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkNextChangeAsNotPersistent();
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( onInput ).toHaveBeenCalledWith(
			[ { clientId: 'a', innerBlocks: [], attributes: { foo: 2 } } ],
			{
				selection: {
					selectionEnd: {},
					selectionStart: {},
					initialPosition: null,
				},
			}
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'calls onChange if a persistent change occurs', async () => {
		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( onChange ).toHaveBeenCalledWith(
			[ { clientId: 'a', innerBlocks: [], attributes: { foo: 2 } } ],
			{
				selection: {
					selectionEnd: {},
					selectionStart: {},
					initialPosition: null,
				},
			}
		);
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'avoids updating the parent if there is a pending incoming change', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		const { rerender } = render(
			<TestWrapper
				clientId="test"
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();
		replaceInnerBlocks.mockClear();

		rerender(
			<TestWrapper
				clientId="test"
				value={ [] }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'test', [] );
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'avoids updating the block-editor store if there is a pending outgoint change', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();
		replaceInnerBlocks.mockClear();

		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( onChange ).toHaveBeenCalledWith(
			[
				{
					name: 'test/test-block',
					clientId: 'a',
					innerBlocks: [],
					attributes: { foo: 2 },
				},
			],
			{
				selection: {
					selectionEnd: {},
					selectionStart: {},
					initialPosition: null,
				},
			}
		);
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'should use fresh callbacks if onChange/onInput have been updated when previous changes have been made', async () => {
		const fakeBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		const onChange1 = jest.fn();
		const onInput = jest.fn();

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ fakeBlocks }
				onChange={ onChange1 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		const updatedBlocks1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 2 } },
		];

		expect( onChange1 ).toHaveBeenCalledWith( updatedBlocks1, {
			selection: {
				initialPosition: null,
				selectionEnd: {},
				selectionStart: {},
			},
		} );

		const newBlocks = [
			{ clientId: 'b', innerBlocks: [], attributes: { foo: 1 } },
		];

		// Reset it so that we can test that it was not called after this point.
		onChange1.mockReset();
		const onChange2 = jest.fn();

		// Update the component to point at a "different entity" (e.g. different
		// blocks and onChange handler.)
		rerender(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ newBlocks }
				onChange={ onChange2 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'b', { foo: 3 } );

		// The first callback should not have been called.
		expect( onChange1 ).not.toHaveBeenCalled();

		// The second callback should be called with the new change.
		expect( onChange2 ).toHaveBeenCalledWith(
			[ { clientId: 'b', innerBlocks: [], attributes: { foo: 3 } } ],
			{
				selection: {
					selectionEnd: {},
					selectionStart: {},
					initialPosition: null,
				},
			}
		);
	} );

	it( 'should use fresh callbacks if onChange/onInput have been updated when no previous changes have been made', async () => {
		const fakeBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		const onChange1 = jest.fn();
		const onInput = jest.fn();

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ fakeBlocks }
				onChange={ onChange1 }
				onInput={ onInput }
			/>
		);

		const newBlocks = [
			{ clientId: 'b', innerBlocks: [], attributes: { foo: 1 } },
		];

		const onChange2 = jest.fn();

		// Update the component to point at a "different entity" (e.g. different
		// blocks and onChange handler.)
		rerender(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ newBlocks }
				onChange={ onChange2 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'b', { foo: 3 } );

		// The first callback should never be called in this scenario.
		expect( onChange1 ).not.toHaveBeenCalled();

		// Only the new callback should be called.
		expect( onChange2 ).toHaveBeenCalledWith(
			[ { clientId: 'b', innerBlocks: [], attributes: { foo: 3 } } ],
			{
				selection: {
					selectionEnd: {},
					selectionStart: {},
					initialPosition: null,
				},
			}
		);
	} );
} );
