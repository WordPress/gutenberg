import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
	getBlockBindingsSource,
	registerBlockBindingsSource,
	registerBlockType,
	unregisterBlockBindingsSource,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { StrictMode } from '@wordpress/element';
import Edit from '../edit';
import { BlockContextProvider } from '../../block-context';
import { PrivateBlockContext } from '../../block-list/private-block-context';
import {
	BlockRefs,
	getBoundAttributesForCopy,
} from '../../provider/block-refs-provider';
import { BlockEditContextProvider, isPreviewModeKey } from '../context';

const noop = () => {};

describe( 'Edit', () => {
	afterEach( () => {
		act( () => {
			if ( getBlockBindingsSource( 'testing/copy' ) ) {
				unregisterBlockBindingsSource( 'testing/copy' );
			}
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );
	} );

	it( 'should return null if block type not defined', () => {
		const { container } = render( <Edit name="core/test-block" /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	describe( 'bound attributes for copying', () => {
		const bindings = { content: { source: 'testing/copy' } };

		function registerBoundBlock(
			getValues = () => ( { content: 'Resolved text' } )
		) {
			registerBlockBindingsSource( {
				name: 'testing/copy',
				label: 'Copy test',
				getValues,
			} );
			registerBlockType( 'core/test-block', {
				apiVersion: 3,
				category: 'text',
				title: 'Copy test',
				edit: ( { attributes } ) => <p>{ attributes.content }</p>,
				save: noop,
			} );
		}

		function BoundEdit( {
			attributesForCopy,
			attributes,
			clientId = 'bound-block',
			bindableAttributes = [ 'content' ],
			isPreviewMode = false,
			blockContext = {},
		} ) {
			return (
				<BlockRefs.Provider value={ { attributesForCopy } }>
					<PrivateBlockContext.Provider
						value={ { bindableAttributes } }
					>
						<BlockEditContextProvider
							value={ { [ isPreviewModeKey ]: isPreviewMode } }
						>
							<BlockContextProvider value={ blockContext }>
								<Edit
									name="core/test-block"
									clientId={ clientId }
									attributes={ attributes }
								/>
							</BlockContextProvider>
						</BlockEditContextProvider>
					</PrivateBlockContext.Provider>
				</BlockRefs.Provider>
			);
		}

		it( 'registers the resolved value without changing the stored attributes', () => {
			registerBoundBlock();
			const attributesForCopy = new Map();
			const attributes = { content: '', metadata: { bindings } };
			const block = { clientId: 'bound-block', attributes };
			const { unmount } = render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
				/>
			);

			expect( screen.getByText( 'Resolved text' ) ).toBeVisible();
			expect(
				getBoundAttributesForCopy( block, attributesForCopy )
			).toEqual( { content: 'Resolved text' } );
			expect( attributes.content ).toBe( '' );
			expect( attributes.metadata.bindings ).toBe( bindings );
			unmount();
			expect( attributesForCopy.size ).toBe( 0 );
		} );

		it( 'refreshes the snapshot when the block attributes change', () => {
			registerBoundBlock();
			const attributesForCopy = new Map();
			const originalAttributes = { content: '', metadata: { bindings } };
			const nextAttributes = { ...originalAttributes, anchor: 'updated' };
			const { rerender } = render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ originalAttributes }
				/>
			);
			rerender(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ nextAttributes }
				/>
			);

			expect(
				getBoundAttributesForCopy(
					{ clientId: 'bound-block', attributes: originalAttributes },
					attributesForCopy
				)
			).toBeUndefined();
			expect(
				getBoundAttributesForCopy(
					{ clientId: 'bound-block', attributes: nextAttributes },
					attributesForCopy
				)
			).toEqual( { content: 'Resolved text' } );
		} );

		it( 'ignores ambiguous instances and removes only the unmounted instance', () => {
			registerBoundBlock();
			const attributesForCopy = new Map();
			const attributes = { content: '', metadata: { bindings } };
			const block = { clientId: 'bound-block', attributes };
			const { unmount: unmountFirst } = render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
				/>
			);
			const { unmount: unmountSecond } = render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
				/>
			);

			expect( attributesForCopy.get( block.clientId ).size ).toBe( 2 );
			expect(
				getBoundAttributesForCopy( block, attributesForCopy )
			).toBeUndefined();
			unmountFirst();
			expect(
				getBoundAttributesForCopy( block, attributesForCopy )
			).toEqual( { content: 'Resolved text' } );
			unmountSecond();
			expect( attributesForCopy.size ).toBe( 0 );
		} );

		it( 'registers a single instance under StrictMode', () => {
			registerBoundBlock();
			const attributesForCopy = new Map();
			const attributes = { content: '', metadata: { bindings } };
			const { unmount } = render(
				<StrictMode>
					<BoundEdit
						attributesForCopy={ attributesForCopy }
						attributes={ attributes }
					/>
				</StrictMode>
			);

			expect( attributesForCopy.get( 'bound-block' ).size ).toBe( 1 );
			unmount();
			expect( attributesForCopy.size ).toBe( 0 );
		} );

		it.each( [
			{ isPreviewMode: true },
			{ clientId: null },
			{ clientId: '' },
			{ attributesForCopy: undefined },
			{ bindableAttributes: [] },
			{ blockContext: { queryId: 0 } },
			{ blockContext: { query: {} } },
		] )(
			'does not register an ineligible edit instance (%j)',
			( props ) => {
				registerBoundBlock();
				const attributesForCopy = new Map();
				const attributes = { content: '', metadata: { bindings } };
				render(
					<BoundEdit
						attributesForCopy={ attributesForCopy }
						attributes={ attributes }
						{ ...props }
					/>
				);

				expect( attributesForCopy.size ).toBe( 0 );
			}
		);

		it( 'does not register bindings to an unknown source', () => {
			registerBoundBlock();
			const attributesForCopy = new Map();
			const attributes = {
				content: '',
				metadata: {
					bindings: { content: { source: 'testing/unknown' } },
				},
			};
			render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
				/>
			);

			expect( attributesForCopy.size ).toBe( 0 );
		} );

		it( 'omits partially resolved attributes', () => {
			registerBoundBlock( () => ( {} ) );
			const attributesForCopy = new Map();
			const attributes = { metadata: { bindings } };
			render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
				/>
			);

			expect(
				getBoundAttributesForCopy(
					{ clientId: 'bound-block', attributes },
					attributesForCopy
				)
			).toBeUndefined();
		} );
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
