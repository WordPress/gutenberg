import {
	isRefManifest,
	resolveJsonPointer,
	resolveRefUrl,
	hydrateManifestEntry,
	type ComponentsManifest,
	type ManifestEntry,
} from '../manifest';

describe( 'manifest dual-shape helpers', () => {
	describe( 'isRefManifest', () => {
		it( 'detects ref-shaped indexes', () => {
			const manifest: ComponentsManifest = {
				v: 1,
				components: {
					button: {
						id: 'button',
						name: 'Button',
						docgen: {
							$ref: '../services/core/docgen/button.json#/components/button',
						},
					},
				},
			};
			expect( isRefManifest( manifest ) ).toBe( true );
		} );

		it( 'detects inline manifests', () => {
			const manifest: ComponentsManifest = {
				v: 0,
				components: {
					button: {
						id: 'button',
						name: 'Button',
						path: '../packages/ui/src/button/stories/index.story.tsx',
						reactComponentMeta: { props: {} },
					},
				},
			};
			expect( isRefManifest( manifest ) ).toBe( false );
		} );
	} );

	describe( 'resolveRefUrl', () => {
		it( 'resolves refs relative to the manifest URL', () => {
			expect(
				resolveRefUrl(
					'https://example.com/gutenberg/manifests/components.json',
					'../services/core/docgen/button.json#/components/button'
				)
			).toEqual( {
				url: 'https://example.com/gutenberg/services/core/docgen/button.json',
				pointer: '/components/button',
			} );
		} );
	} );

	describe( 'resolveJsonPointer', () => {
		it( 'walks object paths', () => {
			expect(
				resolveJsonPointer(
					{ components: { button: { name: 'Button' } } },
					'/components/button'
				)
			).toEqual( { name: 'Button' } );
		} );
	} );

	describe( 'hydrateManifestEntry', () => {
		const originalFetch = globalThis.fetch;

		afterEach( () => {
			globalThis.fetch = originalFetch;
		} );

		it( 'returns inline entries unchanged', async () => {
			const entry: ManifestEntry = {
				id: 'button',
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
			};
			await expect(
				hydrateManifestEntry(
					'https://example.com/manifests/components.json',
					entry
				)
			).resolves.toEqual( entry );
			expect( globalThis.fetch ).toBe( originalFetch );
		} );

		it( 'fetches docgen and story-docs for ref entries', async () => {
			globalThis.fetch = jest.fn( async ( url: RequestInfo | URL ) => {
				const href = url.toString();
				if ( href.endsWith( '/services/core/docgen/button.json' ) ) {
					return {
						ok: true,
						json: async () => ( {
							components: {
								button: {
									id: 'button',
									name: 'Button',
									path: '../packages/ui/src/button/stories/index.story.tsx',
									reactComponentMeta: {
										props: {
											variant: {
												type: { name: 'string' },
												description: 'Variant.',
											},
										},
									},
								},
							},
						} ),
					} as Response;
				}
				if (
					href.endsWith( '/services/core/story-docs/button.json' )
				) {
					return {
						ok: true,
						json: async () => ( {
							components: {
								button: {
									stories: {
										'button--default': {
											name: 'Default',
											snippet: '<Button />',
										},
									},
								},
							},
						} ),
					} as Response;
				}
				throw new Error( `Unexpected fetch: ${ href }` );
			} );

			const hydrated = await hydrateManifestEntry(
				'https://example.com/manifests/components.json',
				{
					id: 'button',
					name: 'Button',
					description: 'A button.',
					docgen: {
						$ref: '../services/core/docgen/button.json#/components/button',
					},
					stories: {
						$ref: '../services/core/story-docs/button.json#/components/button',
					},
				}
			);

			expect( hydrated.path ).toBe(
				'../packages/ui/src/button/stories/index.story.tsx'
			);
			expect( hydrated.reactComponentMeta?.props ).toHaveProperty(
				'variant'
			);
			expect( hydrated.stories ).toEqual( {
				'button--default': {
					name: 'Default',
					snippet: '<Button />',
				},
			} );
			expect( hydrated.docgen ).toBeUndefined();
		} );
	} );
} );
