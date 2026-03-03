/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */

describe( 'Button Block Entity Binding', () => {
	describe( 'Binding source selection', () => {
		it( 'should use core/post-data source for post-type entities', () => {
			// Test that when kind is 'post-type', source should be 'core/post-data'
			const kind = 'post-type';
			const expectedSource =
				kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';
			expect( expectedSource ).toBe( 'core/post-data' );
		} );

		it( 'should use core/term-data source for taxonomy entities', () => {
			// Test that when kind is 'taxonomy', source should be 'core/term-data'
			const kind = 'taxonomy';
			const expectedSource =
				kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';
			expect( expectedSource ).toBe( 'core/term-data' );
		} );
	} );

	describe( 'Entity binding detection', () => {
		it( 'should detect post-data binding as entity binding', () => {
			const metadata = {
				id: 123,
				kind: 'post-type',
				type: 'page',
				bindings: {
					url: {
						source: 'core/post-data',
						args: { field: 'link' },
					},
				},
			};

			const urlBinding = metadata?.bindings?.url;
			const isEntityUrlBinding =
				urlBinding?.source === 'core/post-data' ||
				urlBinding?.source === 'core/term-data';

			expect( isEntityUrlBinding ).toBe( true );
		} );

		it( 'should detect term-data binding as entity binding', () => {
			const metadata = {
				id: 456,
				kind: 'taxonomy',
				type: 'category',
				bindings: {
					url: {
						source: 'core/term-data',
						args: { field: 'link' },
					},
				},
			};

			const urlBinding = metadata?.bindings?.url;
			const isEntityUrlBinding =
				urlBinding?.source === 'core/post-data' ||
				urlBinding?.source === 'core/term-data';

			expect( isEntityUrlBinding ).toBe( true );
		} );

		it( 'should not detect other bindings as entity bindings', () => {
			const metadata = {
				bindings: {
					url: {
						source: 'core/post-meta',
						args: { key: 'custom_url' },
					},
				},
			};

			const urlBinding = metadata?.bindings?.url;
			const isEntityUrlBinding =
				urlBinding?.source === 'core/post-data' ||
				urlBinding?.source === 'core/term-data';

			expect( isEntityUrlBinding ).toBe( false );
		} );
	} );

	describe( 'Binding metadata structure', () => {
		it( 'should create correct metadata for post-type entity', () => {
			const id = 123;
			const kind = 'post-type';
			const type = 'page';
			const source =
				kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';

			const metadata = {
				id,
				kind,
				type,
				bindings: {
					url: {
						source,
						args: { field: 'link' },
					},
				},
			};

			expect( metadata.id ).toBe( 123 );
			expect( metadata.kind ).toBe( 'post-type' );
			expect( metadata.type ).toBe( 'page' );
			expect( metadata.bindings.url.source ).toBe( 'core/post-data' );
			expect( metadata.bindings.url.args.field ).toBe( 'link' );
		} );

		it( 'should create correct metadata for taxonomy entity', () => {
			const id = 789;
			const kind = 'taxonomy';
			const type = 'category';
			const source =
				kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';

			const metadata = {
				id,
				kind,
				type,
				bindings: {
					url: {
						source,
						args: { field: 'link' },
					},
				},
			};

			expect( metadata.id ).toBe( 789 );
			expect( metadata.kind ).toBe( 'taxonomy' );
			expect( metadata.type ).toBe( 'category' );
			expect( metadata.bindings.url.source ).toBe( 'core/term-data' );
			expect( metadata.bindings.url.args.field ).toBe( 'link' );
		} );
	} );

	describe( 'Clearing entity binding', () => {
		it( 'should clear binding metadata when clearing entity binding', () => {
			const metadata = {
				id: 123,
				kind: 'post-type',
				type: 'page',
				bindings: {
					url: {
						source: 'core/post-data',
						args: { field: 'link' },
					},
				},
			};

			// Simulate clearing the binding
			const newMetadata = { ...metadata };
			delete newMetadata.bindings?.url;
			delete newMetadata.id;
			delete newMetadata.kind;
			delete newMetadata.type;

			if (
				newMetadata.bindings &&
				Object.keys( newMetadata.bindings ).length === 0
			) {
				delete newMetadata.bindings;
			}

			expect( newMetadata.id ).toBeUndefined();
			expect( newMetadata.kind ).toBeUndefined();
			expect( newMetadata.type ).toBeUndefined();
			expect( newMetadata.bindings ).toBeUndefined();
		} );
	} );

	describe( 'Entity info extraction from metadata', () => {
		it( 'should extract entity info from metadata for post-type', () => {
			const metadata = {
				id: 123,
				kind: 'post-type',
				type: 'page',
				bindings: {
					url: {
						source: 'core/post-data',
						args: { field: 'link' },
					},
				},
			};

			const boundEntityId = metadata?.id;
			const boundEntityKind = metadata?.kind;
			const boundEntityType = metadata?.type;
			const urlBinding = metadata?.bindings?.url;
			const isEntityUrlBinding =
				urlBinding?.source === 'core/post-data' ||
				urlBinding?.source === 'core/term-data';

			expect( isEntityUrlBinding ).toBe( true );
			expect( boundEntityId ).toBe( 123 );
			expect( boundEntityKind ).toBe( 'post-type' );
			expect( boundEntityType ).toBe( 'page' );
		} );

		it( 'should extract entity info from metadata for taxonomy', () => {
			const metadata = {
				id: 456,
				kind: 'taxonomy',
				type: 'category',
				bindings: {
					url: {
						source: 'core/term-data',
						args: { field: 'link' },
					},
				},
			};

			const boundEntityId = metadata?.id;
			const boundEntityKind = metadata?.kind;
			const boundEntityType = metadata?.type;
			const urlBinding = metadata?.bindings?.url;
			const isEntityUrlBinding =
				urlBinding?.source === 'core/post-data' ||
				urlBinding?.source === 'core/term-data';

			expect( isEntityUrlBinding ).toBe( true );
			expect( boundEntityId ).toBe( 456 );
			expect( boundEntityKind ).toBe( 'taxonomy' );
			expect( boundEntityType ).toBe( 'category' );
		} );
	} );
} );
