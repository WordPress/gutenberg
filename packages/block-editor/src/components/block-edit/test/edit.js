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

/**
 * Internal dependencies
 */
import { Edit } from '../edit';
import { BlockContextProvider } from '../../block-context';

const noop = () => {};

describe( 'Edit', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return null if block type not defined', () => {
		const { container } = render( <Edit name="core/test-block" /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should use edit implementation of block', () => {
		const edit = () => <div data-testid="foo-bar" />;

		registerBlockType( 'core/test-block', {
			save: noop,
			category: 'text',
			title: 'block title',
			edit,
		} );

		render( <Edit name="core/test-block" /> );

		expect( screen.getByTestId( 'foo-bar' ) ).toBeVisible();
	} );

	it( 'should use save implementation of block as fallback', () => {
		const save = () => <div data-testid="foo-bar" />;

		registerBlockType( 'core/test-block', {
			save,
			category: 'text',
			title: 'block title',
		} );

		render( <Edit name="core/test-block" /> );

		expect( screen.getByTestId( 'foo-bar' ) ).toBeVisible();
	} );

	it( 'should combine the default class name with a custom one', () => {
		const edit = ( { className } ) => (
			<div data-testid="foo-bar" className={ className } />
		);
		const attributes = {
			className: 'my-class',
		};

		registerBlockType( 'core/test-block', {
			edit,
			save: noop,
			category: 'text',
			title: 'block title',
		} );

		render( <Edit name="core/test-block" attributes={ attributes } /> );

		const editElement = screen.getByTestId( 'foo-bar' );
		expect( editElement ).toHaveClass( 'wp-block-test-block' );
		expect( editElement ).toHaveClass( 'my-class' );
	} );

	it( 'should assign context', () => {
		const edit = ( { context } ) => context.value;
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'block title',
			usesContext: [ 'value' ],
			edit,
			save: noop,
		} );

		const { container } = render(
			<BlockContextProvider value={ { value: 'Ok' } }>
				<Edit name="core/test-block" />
			</BlockContextProvider>
		);

		expect( container ).toHaveTextContent( 'Ok' );
	} );

	describe( 'light wrapper', () => {
		it( 'should assign context', () => {
			const edit = ( { context } ) => context.value;
			registerBlockType( 'core/test-block', {
				apiVersion: 2,
				category: 'text',
				title: 'block title',
				usesContext: [ 'value' ],
				edit,
				save: noop,
			} );

			const { container } = render(
				<BlockContextProvider value={ { value: 'Ok' } }>
					<Edit name="core/test-block" />
				</BlockContextProvider>
			);

			expect( container ).toHaveTextContent( 'Ok' );
		} );
	} );
} );
