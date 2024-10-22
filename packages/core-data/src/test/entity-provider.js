/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { registerCoreBlocks } from '@wordpress/block-library';
import { unregisterFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../index';
import useEntityBlockEditor from '../hooks/use-entity-block-editor';

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
		item_reverted_to_draft: 'Post reverted to draft.',
	},
};

const aSinglePost = {
	id: 1,
	type: 'post',
	content: {
		raw: '<!-- wp:test-block-with-array-of-strings --><div><p>apples</p><p></p><p>oranges</p></div><!-- /wp:test-block-with-array-of-strings --><!-- wp:test-block --><p>A paragraph</p><!-- /wp:test-block -->',
		rendered: '<p>A paragraph</p>',
	},
	meta: {
		footnotes: '[]',
	},
};

function createRegistryWithStores() {
	// Create a registry.
	const registry = createRegistry();

	// Register store.
	registry.register( coreDataStore );

	// Register post type entity.
	registry.dispatch( coreDataStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store a single post for use by the tests.
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'postType', 'post', [ aSinglePost ] );

	return registry;
}

describe( 'useEntityBlockEditor', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistryWithStores();

		const edit = ( { children } ) => <>{ children }</>;

		registerBlockType( 'core/test-block', {
			supports: {
				className: false,
			},
			save: ( { attributes } ) => {
				const { content } = attributes;
				return (
					<p { ...useBlockProps.save() }>
						<RichText.Content value={ content } />
					</p>
				);
			},
			category: 'text',
			attributes: {
				content: {
					type: 'string',
					source: 'html',
					selector: 'p',
					default: '',
					role: 'content',
				},
			},
			title: 'block title',
			edit,
		} );

		registerBlockType( 'core/test-block-with-array-of-strings', {
			supports: {
				className: false,
			},
			save: ( { attributes } ) => {
				const { items } = attributes;
				return (
					<div>
						{ items.map( ( item, index ) => (
							<p key={ index }>{ item }</p>
						) ) }
					</div>
				);
			},
			category: 'text',
			attributes: {
				items: {
					type: 'array',
					items: {
						type: 'string',
					},
					default: [ 'apples', null, 'oranges' ],
				},
			},
			title: 'block title',
			edit,
		} );

		registerCoreBlocks();
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
		unregisterFormatType( 'core/footnote' );
	} );

	it( 'does not mutate block attributes that include an array of strings or null values', async () => {
		let blocks, onChange;
		const TestComponent = () => {
			[ blocks, , onChange ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} );

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( blocks[ 0 ].name ).toEqual(
			'core/test-block-with-array-of-strings'
		);
		expect( blocks[ 0 ].attributes.items ).toEqual( [
			'apples',
			null,
			'oranges',
		] );

		// Add a block with content that will match against footnotes logic, causing
		// `updateFootnotes` to iterate over blocks and their attributes.
		act( () => {
			onChange(
				[
					...blocks,
					createBlock( 'core/test-block', {
						content:
							'<p><sup data-fn="1234" class="fn"><a href="#1234" id="1234-link">1</a></sup></p>',
					} ),
				],
				{
					selection: {
						selectionStart: {},
						selectionEnd: {},
						initialPosition: {},
					},
				}
			);
		} );

		// Ensure the first block remains the same, with unaltered attributes.
		expect( blocks[ 0 ].name ).toEqual(
			'core/test-block-with-array-of-strings'
		);
		expect( blocks[ 0 ].attributes.items ).toEqual( [
			'apples',
			null,
			'oranges',
		] );
	} );

	it( 'updates the order of footnotes when a new footnote is inserted', async () => {
		// Start with a post containing a block with a single footnote (set to 1).
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'postType', 'post', [
				{
					id: 1,
					type: 'post',
					content: {
						raw: '<!-- wp:test-block --><p>A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">1</a></sup></p><!-- /wp:test-block -->',
						rendered: '<p>A paragraph</p>',
					},
					meta: {
						footnotes: '[]',
					},
				},
			] );

		let blocks, onChange;

		const TestComponent = () => {
			[ blocks, , onChange ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} );

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// The first block should have the footnote number 1.
		expect( blocks[ 0 ].attributes.content ).toEqual(
			'A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">1</a></sup>'
		);

		// Add a block with a new footnote with an arbitrary footnote number that will be overwritten after insertion.
		act( () => {
			onChange(
				[
					createBlock( 'core/test-block', {
						content:
							'A new paragraph<sup data-fn="xyz" class="fn"><a href="#xyz" id="xyz-link">999</a></sup>',
					} ),
					...blocks,
				],
				{
					selection: {
						selectionStart: {},
						selectionEnd: {},
						initialPosition: {},
					},
				}
			);
		} );

		// The newly inserted block should have the footnote number 1, and the
		// existing footnote number 1 should be updated to 2.
		expect( blocks[ 0 ].attributes.content ).toEqual(
			'A new paragraph<sup data-fn="xyz" class="fn"><a href="#xyz" id="xyz-link">1</a></sup>'
		);
		expect( blocks[ 1 ].attributes.content ).toEqual(
			'A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">2</a></sup>'
		);
	} );
} );
