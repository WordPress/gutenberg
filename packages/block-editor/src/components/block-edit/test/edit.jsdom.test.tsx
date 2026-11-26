import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
	getBlockBindingsSource,
	createBlock,
	registerBlockBindingsSource,
	registerBlockType,
	unregisterBlockBindingsSource,
	unregisterBlockType,
	getBlockTypes,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { StrictMode, useContext } from '@wordpress/element';
import type { ComponentProps } from 'react';
import Edit from '../edit';
import { BlockContextProvider } from '../../block-context';
import { PrivateBlockContext } from '../../block-list/private-block-context';
import {
	BlockRefs,
	getBoundAttributesForCopy,
} from '../../provider/block-refs-provider';
import { BlockEditContextProvider, isPreviewModeKey } from '../context';
import { unlock } from '../../../lock-unlock';
import { getBoundPartialBlockForCopy } from '../../writing-flow/utils';

const noop = () => null;

describe( 'Edit', () => {
	afterEach( () => {
		act( () => {
			if ( getBlockBindingsSource( 'testing/copy' ) ) {
				unregisterBlockBindingsSource( 'testing/copy' );
			}
			if ( getBlockBindingsSource( 'testing/legacy' ) ) {
				unregisterBlockBindingsSource( 'testing/legacy' );
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
			getValues: ( options?: {
				isForCopy?: boolean;
			} ) => Record< string, unknown > = () => ( {
				content: 'Resolved text',
			} ),
			copySupport: { supportsCopy?: boolean } = { supportsCopy: true },
			onEdit?: ( attributes: Record< string, unknown > ) => void
		) {
			registerBlockBindingsSource( {
				name: 'testing/copy',
				label: 'Copy test',
				getValues,
				...copySupport,
			} );
			registerBlockType( 'core/test-block', {
				attributes: {},
				apiVersion: 3,
				category: 'text',
				title: 'Copy test',
				edit: ( { attributes } ) => {
					onEdit?.( attributes );
					return (
						<p>
							{
								( attributes.content ??
									attributes.text ) as string
							}
						</p>
					);
				},
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
		}: {
			attributesForCopy?: ComponentProps<
				typeof BlockRefs.Provider
			>[ 'value' ][ 'attributesForCopy' ];
			attributes: ComponentProps< typeof Edit >[ 'attributes' ];
			clientId?: string | null;
			bindableAttributes?: string[];
			isPreviewMode?: boolean;
			blockContext?: Record< string, unknown >;
		} ) {
			const blockRefs = useContext( BlockRefs );
			const blockBindingsSources = useSelect(
				( select ) =>
					unlock(
						select( blocksStore )
					).getAllBlockBindingsSources(),
				[]
			);
			return (
				<BlockRefs.Provider
					value={ {
						...blockRefs,
						attributesForCopy: attributesForCopy!,
					} }
				>
					<PrivateBlockContext.Provider
						value={ { bindableAttributes, blockBindingsSources } }
					>
						<BlockEditContextProvider
							value={ {
								name: 'core/test-block',
								[ isPreviewModeKey ]: isPreviewMode,
							} }
						>
							<BlockContextProvider value={ blockContext }>
								<Edit
									name="core/test-block"
									clientId={ clientId! }
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

		it.each( [ {}, { supportsCopy: false } ] )(
			'keeps an unaware source display value out of copied attributes (%j)',
			( copySupport ) => {
				const getValues = vi.fn( () => ( {
					content: 'Display placeholder',
				} ) );
				registerBoundBlock( getValues, copySupport );
				const attributesForCopy = new Map();
				const attributes = {
					content: 'Saved fallback',
					metadata: { bindings },
				};
				render(
					<BoundEdit
						attributesForCopy={ attributesForCopy }
						attributes={ attributes }
					/>
				);
				expect(
					screen.getByText( 'Display placeholder' )
				).toBeVisible();
				const callsBeforeCopy = getValues.mock.calls.length;
				expect(
					getBoundAttributesForCopy(
						{ clientId: 'bound-block', attributes },
						attributesForCopy
					)
				).toBeUndefined();
				expect( getValues ).toHaveBeenCalledTimes( callsBeforeCopy );
				expect( attributesForCopy.size ).toBe( 0 );
				expect( attributes.content ).toBe( 'Saved fallback' );
			}
		);

		it( 'resolves only opted-in attributes when a block also has an unaware source', () => {
			const getValues = vi.fn(
				( { isForCopy }: { isForCopy?: boolean } = {} ) => ( {
					content: isForCopy ? 'Copy value' : 'Display value',
				} )
			);
			const legacyGetValues = vi.fn( () => ( {
				text: 'Legacy placeholder',
			} ) );
			registerBoundBlock( getValues );
			registerBlockBindingsSource( {
				name: 'testing/legacy',
				label: 'Legacy source',
				getValues: legacyGetValues,
			} );
			const attributesForCopy = new Map();
			const attributes = {
				content: 'Saved content',
				text: 'Saved text',
				metadata: {
					bindings: {
						...bindings,
						text: { source: 'testing/legacy' },
					},
				},
			};
			render(
				<BoundEdit
					attributesForCopy={ attributesForCopy }
					attributes={ attributes }
					bindableAttributes={ [ 'content', 'text' ] }
				/>
			);
			const legacyCallsBeforeCopy = legacyGetValues.mock.calls.length;
			expect(
				getValues.mock.calls.some(
					( [ options ] ) => options?.isForCopy
				)
			).toBe( false );
			expect(
				getBoundAttributesForCopy(
					{ clientId: 'bound-block', attributes },
					attributesForCopy
				)
			).toEqual( { content: 'Copy value' } );
			expect( legacyGetValues ).toHaveBeenCalledTimes(
				legacyCallsBeforeCopy
			);
			expect( attributes.text ).toBe( 'Saved text' );
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
			{ blockContext: { termQuery: {} } },
			{ blockContext: { commentId: 12 } },
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

		it.each( [ undefined, 'https://example.com/saved' ] )(
			'keeps resolved Button text when its bound URL fallback is %s',
			( url ) => {
				registerBoundBlock( () => ( { text: 'Visible label' } ) );
				const attributesForCopy = new Map();
				const attributes = {
					...( url ? { url } : {} ),
					metadata: {
						bindings: {
							text: { source: 'testing/copy' },
							url: { source: 'testing/copy' },
						},
					},
				};
				render(
					<BoundEdit
						attributesForCopy={ attributesForCopy }
						attributes={ attributes }
						bindableAttributes={ [ 'text', 'url' ] }
					/>
				);

				expect( screen.getByText( 'Visible label' ) ).toBeVisible();
				expect(
					getBoundAttributesForCopy(
						{ clientId: 'bound-block', attributes },
						attributesForCopy
					)
				).toEqual( {
					text: 'Visible label',
				} );
				const block = {
					...createBlock( 'core/test-block' ),
					clientId: 'bound-block',
					attributes,
				};
				expect(
					getBoundPartialBlockForCopy(
						block,
						block,
						attributesForCopy,
						{}
					).attributes
				).toEqual( { ...attributes, text: 'Visible label' } );
				expect( attributes ).not.toHaveProperty( 'text' );
			}
		);

		it.each( [
			'?s=books',
			'',
			null,
			undefined,
			'https://example.com/new',
		] )(
			'preserves the saved Button URL when its copy value is invalid (%s)',
			( resolvedUrl ) => {
				const onEdit = vi.fn();
				registerBoundBlock(
					() => ( { text: 'Visible label', url: resolvedUrl } ),
					{ supportsCopy: true },
					onEdit
				);
				const attributesForCopy = new Map();
				const attributes = {
					url: 'https://example.com/saved',
					metadata: {
						bindings: {
							text: { source: 'testing/copy' },
							url: { source: 'testing/copy' },
						},
					},
				};
				render(
					<BoundEdit
						attributesForCopy={ attributesForCopy }
						attributes={ attributes }
						bindableAttributes={ [ 'text', 'url' ] }
					/>
				);
				const validUrl = resolvedUrl === 'https://example.com/new';
				expect( onEdit ).toHaveBeenLastCalledWith(
					expect.objectContaining( {
						url: validUrl ? resolvedUrl : null,
						text: 'Visible label',
					} )
				);
				const copiedAttributes = getBoundAttributesForCopy(
					{ clientId: 'bound-block', attributes },
					attributesForCopy
				);
				expect( copiedAttributes ).toEqual( {
					text: 'Visible label',
					...( validUrl ? { url: resolvedUrl } : {} ),
				} );
				expect( { ...attributes, ...copiedAttributes }.url ).toBe(
					validUrl ? resolvedUrl : 'https://example.com/saved'
				);
				expect( attributes.url ).toBe( 'https://example.com/saved' );
			}
		);

		it( 'omits attributes when none of the bound values is available', () => {
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
			attributes: {},
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
			attributes: {},
			apiVersion: 3,
			save,
			category: 'text',
			title: 'block title',
		} );

		render( <Edit name="core/test-block" /> );

		expect( screen.getByTestId( 'foo-bar' ) ).toBeVisible();
	} );

	it( 'should combine the default class name with a custom one', () => {
		const edit = ( { className }: { className?: string } ) => (
			<div data-testid="foo-bar" className={ className } />
		);
		const attributes = {
			className: 'my-class',
		};

		registerBlockType( 'core/test-block', {
			attributes: {},
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
		// The test context holds a string.
		const edit = ( { context }: { context: Record< string, unknown > } ) =>
			context.value as string;
		registerBlockType( 'core/test-block', {
			attributes: {},
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
			// The test context holds a string.
			const edit = ( {
				context,
			}: {
				context: Record< string, unknown >;
			} ) => context.value as string;
			registerBlockType( 'core/test-block', {
				attributes: {},
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
