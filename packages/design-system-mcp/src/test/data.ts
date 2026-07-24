import {
	getComponents,
	getComponentDetail,
	getDesignTokens,
	resetCache,
} from '../data';
import manifestFixture from './fixtures/manifest.json';
import manifestRefFixture from './fixtures/manifest-ref.json';
import buttonDocgenFixture from './fixtures/services/core/docgen/components-button.json';
import badgeDocgenFixture from './fixtures/services/core/docgen/ui-badge.json';
import buttonStoryDocsFixture from './fixtures/services/core/story-docs/components-button.json';

const MANIFEST_URL =
	'https://wordpress.github.io/gutenberg/manifests/components.json';
const TOKENS_URL =
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/packages/theme/docs/tokens.md';

const originalFetch = globalThis.fetch;

function mockFetchResponses(
	handlers: Record< string, { ok: boolean; body: unknown } >
) {
	globalThis.fetch = jest.fn( ( url: RequestInfo | URL ) => {
		const urlStr = url.toString();
		const handler = handlers[ urlStr ];
		if ( ! handler ) {
			return Promise.reject(
				new Error( `Unexpected fetch: ${ urlStr }` )
			);
		}
		return Promise.resolve( {
			ok: handler.ok,
			status: handler.ok ? 200 : 500,
			statusText: handler.ok ? 'OK' : 'Internal Server Error',
			json: () => Promise.resolve( handler.body ),
			text: () => Promise.resolve( handler.body as string ),
		} as Response );
	} );
}

describe( 'data', () => {
	beforeEach( () => {
		resetCache();
		globalThis.fetch = jest.fn();
	} );

	afterEach( () => {
		globalThis.fetch = originalFetch;
	} );

	describe( 'getComponents (inline manifest)', () => {
		it( 'should fetch manifest and return parsed components', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestFixture },
			} );

			const result = await getComponents();

			expect( result ).toEqual( [
				{
					name: 'Badge',
					description: 'A badge.',
				},
				{
					name: 'Button',
					description: 'A button.',
				},
			] );
		} );

		it( 'should cache the manifest across calls', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestFixture },
			} );

			await getComponents();
			await getComponents();

			expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should throw on fetch failure', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: false, body: null },
			} );

			await expect( getComponents() ).rejects.toThrow(
				'Failed to fetch components manifest'
			);
		} );
	} );

	describe( 'getComponentDetail (inline manifest)', () => {
		it( 'should return detail for a matching component', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestFixture },
			} );

			const result = await getComponentDetail( 'Button' );

			expect( result ).toEqual( {
				name: 'Button',
				description: 'A button.',
				packageName: '@wordpress/components',
				importStatement:
					"import { Button } from '@wordpress/components';",
				props: [
					{
						name: 'variant',
						type: 'string',
						required: false,
						description: 'The variant.',
						defaultValue: null,
					},
				],
				stories: [ { name: 'Default', snippet: '<Button />' } ],
			} );
		} );

		it( 'should return null for non-existent component', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestFixture },
			} );

			expect( await getComponentDetail( 'NonExistent' ) ).toBeNull();
		} );

		it( 'should share cache with getComponents', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestFixture },
			} );

			await getComponents();
			await getComponentDetail( 'Button' );

			expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'ref manifest', () => {
		const DOCGEN_BUTTON =
			'https://wordpress.github.io/gutenberg/services/core/docgen/components-button.json';
		const DOCGEN_BADGE =
			'https://wordpress.github.io/gutenberg/services/core/docgen/ui-badge.json';
		const STORY_DOCS_BUTTON =
			'https://wordpress.github.io/gutenberg/services/core/story-docs/components-button.json';

		it( 'lists components from the index without resolving refs', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestRefFixture },
			} );

			const result = await getComponents();

			expect( result ).toEqual( [
				{ name: 'Badge', description: 'A badge.' },
				{ name: 'Button', description: 'A button.' },
			] );
			expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'resolves docgen and story-docs only for requested details', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestRefFixture },
				[ DOCGEN_BUTTON ]: { ok: true, body: buttonDocgenFixture },
				[ STORY_DOCS_BUTTON ]: {
					ok: true,
					body: buttonStoryDocsFixture,
				},
			} );

			const result = await getComponentDetail( 'Button' );

			expect( result ).toEqual( {
				name: 'Button',
				description: 'A button.',
				packageName: '@wordpress/components',
				importStatement:
					"import { Button } from '@wordpress/components';",
				props: [
					{
						name: 'variant',
						type: 'string',
						required: false,
						description: 'The variant.',
						defaultValue: null,
					},
				],
				stories: [ { name: 'Default', snippet: '<Button />' } ],
			} );
			expect( globalThis.fetch ).toHaveBeenCalledTimes( 3 );
			expect( globalThis.fetch ).not.toHaveBeenCalledWith( DOCGEN_BADGE );
		} );

		it( 'hydrates badge detail from docgen when stories ref is absent', async () => {
			mockFetchResponses( {
				[ MANIFEST_URL ]: { ok: true, body: manifestRefFixture },
				[ DOCGEN_BADGE ]: { ok: true, body: badgeDocgenFixture },
			} );

			const result = await getComponentDetail( 'Badge' );

			expect( result ).toEqual( {
				name: 'Badge',
				description: 'A badge.',
				packageName: '@wordpress/ui',
				importStatement: "import { Badge } from '@wordpress/ui';",
				props: [],
				stories: [],
			} );
		} );
	} );

	describe( 'getDesignTokens', () => {
		it( 'should fetch and return token content', async () => {
			mockFetchResponses( {
				[ TOKENS_URL ]: {
					ok: true,
					body: '# Tokens\n\n| token | value |',
				},
			} );

			const result = await getDesignTokens();

			expect( result ).toEqual( {
				content: '# Tokens\n\n| token | value |',
			} );
		} );

		it( 'should cache tokens across calls', async () => {
			mockFetchResponses( {
				[ TOKENS_URL ]: { ok: true, body: '# Tokens' },
			} );

			await getDesignTokens();
			await getDesignTokens();

			expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should throw on fetch failure', async () => {
			mockFetchResponses( {
				[ TOKENS_URL ]: { ok: false, body: null },
			} );

			await expect( getDesignTokens() ).rejects.toThrow(
				'Failed to fetch design tokens'
			);
		} );
	} );
} );
