import { render, screen } from '@testing-library/react';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	registerBlockBindingsSource,
	unregisterBlockBindingsSource,
} from '@wordpress/blocks';
import Edit from '../edit';
import { BlockContextProvider } from '../../block-context';
import { PrivateBlockContext } from '../../block-list/private-block-context';

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
			apiVersion: 3,
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
			apiVersion: 3,
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

		// This test is for API version 1 blocks, so the console warning is intentional.
		// API version 1 blocks automatically receive the default block class name,
		// while API version 2+ blocks require useBlockProps() to be used explicitly.
		expect( console ).toHaveWarnedWith(
			'Block with API version 2 or lower is deprecated since version 6.9. See: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/block-migration-for-iframe-editor-compatibility/ Note: The block "core/test-block" is registered with API version 1. This means that the post editor may work as a non-iframe editor. Since all editors are planned to work as iframes in the future, set the `apiVersion` field to 3 and test the block inside the iframe editor.'
		);

		const editElement = screen.getByTestId( 'foo-bar' );
		expect( editElement ).toHaveClass( 'wp-block-test-block' );
		expect( editElement ).toHaveClass( 'my-class' );
	} );

	it( 'should assign context', () => {
		const edit = ( { context } ) => context.value;
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
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

	describe( 'bound `url` attributes', () => {
		const SOURCE_NAME = 'test/url-source';
		let view;

		function renderBoundBlock( value ) {
			const edit = ( { attributes } ) => (
				<div
					data-testid="foo-bar"
					data-url={ String( attributes.url ) }
				/>
			);

			registerBlockType( 'core/test-block', {
				apiVersion: 3,
				category: 'text',
				title: 'block title',
				attributes: { url: { type: 'string' } },
				edit,
				save: noop,
			} );

			registerBlockBindingsSource( {
				name: SOURCE_NAME,
				label: 'Test source',
				getValues: () => ( { url: value } ),
			} );

			view = render(
				<PrivateBlockContext.Provider
					value={ { bindableAttributes: [ 'url' ] } }
				>
					<Edit
						name="core/test-block"
						clientId="test-client-id"
						attributes={ {
							url: 'https://wordpress.org',
							metadata: {
								bindings: { url: { source: SOURCE_NAME } },
							},
						} }
					/>
				</PrivateBlockContext.Provider>
			);

			return view;
		}

		afterEach( () => {
			// Unmount before unregistering, so that the store update does not
			// re-render a still mounted subscriber outside of `act`.
			view?.unmount();
			view = undefined;
			unregisterBlockBindingsSource( SOURCE_NAME );
		} );

		// Sources return raw values (e.g. post meta registered as `integer` or
		// `array`), which previously threw inside `isURLLike` and crashed the
		// block. See https://github.com/WordPress/gutenberg/pull/67523.
		it.each( [
			[ 'an integer', 123 ],
			[ 'a float', 1.5 ],
			[ 'a boolean', true ],
			[ 'an array', [ 'https://wordpress.org' ] ],
			[ 'an object', { url: 'https://wordpress.org' } ],
		] )( 'nulls the url when the source returns %s', ( _label, value ) => {
			renderBoundBlock( value );

			expect( screen.getByTestId( 'foo-bar' ) ).toHaveAttribute(
				'data-url',
				'null'
			);
		} );

		// These already returned `null` via the falsy check preceding
		// `isURLLike`, which is what masked the crash for non-string values.
		it.each( [
			[ 'zero', 0 ],
			[ 'an empty string', '' ],
			[ 'null', null ],
			[ 'false', false ],
		] )( 'nulls the url when the source returns %s', ( _label, value ) => {
			renderBoundBlock( value );

			expect( screen.getByTestId( 'foo-bar' ) ).toHaveAttribute(
				'data-url',
				'null'
			);
		} );

		it( 'keeps the url when the source returns a URL-like string', () => {
			renderBoundBlock( 'https://example.com/image.png' );

			expect( screen.getByTestId( 'foo-bar' ) ).toHaveAttribute(
				'data-url',
				'https://example.com/image.png'
			);
		} );
	} );

	describe( 'light wrapper', () => {
		it( 'should assign context', () => {
			const edit = ( { context } ) => context.value;
			registerBlockType( 'core/test-block', {
				apiVersion: 3,
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
