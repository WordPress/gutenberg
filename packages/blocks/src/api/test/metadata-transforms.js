import {
	mergeBlockTransforms,
	normalizeMetadataTransforms,
	resolveDeclaredContentSchema,
} from '../metadata-transforms';
import {
	getBlockType,
	registerBlockType,
	unregisterBlockType,
	// eslint-disable-next-line camelcase
	unstable__bootstrapServerSideBlockDefinitions,
} from '../registration';

describe( 'mergeBlockTransforms', () => {
	it( 'leaves transforms registered only in JavaScript untouched', () => {
		const transform = () => {};
		const client = {
			from: [ { type: 'raw', selector: 'p', transform } ],
			to: [ { type: 'block', blocks: [ 'core/heading' ], transform } ],
		};

		expect( mergeBlockTransforms( {}, client ) ).toEqual( client );
		expect( mergeBlockTransforms( undefined, client ) ).toEqual( client );
	} );

	it( 'leaves a block declaring no transforms without any', () => {
		expect( mergeBlockTransforms( {}, undefined ) ).toBeUndefined();
		expect( mergeBlockTransforms( undefined, undefined ) ).toBeUndefined();
	} );

	it( 'carries over keys that are not a direction', () => {
		const client = { supportedMobileTransforms: [ 'core/paragraph' ] };

		expect( mergeBlockTransforms( {}, client ) ).toEqual( client );
	} );

	it( 'appends declared and registered transforms when no name is shared', () => {
		const declared = { from: [ { name: 'from-raw', type: 'raw' } ] };
		const client = { from: [ { type: 'block', blocks: [ 'core/x' ] } ] };

		expect( mergeBlockTransforms( declared, client ).from ).toEqual( [
			{ name: 'from-raw', type: 'raw' },
			{ type: 'block', blocks: [ 'core/x' ] },
		] );
	} );

	it( 'merges a registered transform over the declared one of the same name', () => {
		const transform = () => {};
		const declared = {
			from: [ { name: 'from-raw', type: 'raw', selector: 'p' } ],
		};
		const client = { from: [ { name: 'from-raw', transform } ] };

		expect( mergeBlockTransforms( declared, client ).from ).toEqual( [
			{ name: 'from-raw', type: 'raw', selector: 'p', transform },
		] );
	} );
} );

describe( 'resolveDeclaredContentSchema', () => {
	it( 'replaces the phrasing token with the phrasing content schema', () => {
		const phrasingContentSchema = { strong: {} };
		const resolved = resolveDeclaredContentSchema(
			{ p: { children: 'phrasing' } },
			{ phrasingContentSchema }
		);

		expect( resolved ).toEqual( {
			p: { children: phrasingContentSchema },
		} );
	} );

	it( 'picks the attribute list matching the context', () => {
		const schema = {
			p: { attributes: { default: [ 'style', 'id' ], paste: [] } },
		};

		expect(
			resolveDeclaredContentSchema( schema, { isPaste: false } )
		).toEqual( { p: { attributes: [ 'style', 'id' ] } } );
		expect(
			resolveDeclaredContentSchema( schema, { isPaste: true } )
		).toEqual( { p: { attributes: [] } } );
	} );

	it( 'leaves a plain attribute list and a wildcard alone', () => {
		const schema = {
			blockquote: { children: '*' },
			'wp-block': { attributes: [ 'data-block' ] },
		};

		expect( resolveDeclaredContentSchema( schema ) ).toEqual( schema );
	} );

	it( 'resolves tokens nested inside children', () => {
		const phrasingContentSchema = { em: {} };
		const resolved = resolveDeclaredContentSchema(
			{ table: { children: { td: { children: 'phrasing' } } } },
			{ phrasingContentSchema }
		);

		expect( resolved ).toEqual( {
			table: { children: { td: { children: phrasingContentSchema } } },
		} );
	} );
} );

describe( 'normalizeMetadataTransforms', () => {
	it( 'returns nothing for a block with no declared transforms', () => {
		expect( normalizeMetadataTransforms( undefined, 'core/x' ) ).toEqual(
			{}
		);
	} );

	it( 'leaves a selector-only raw transform without a transform function', () => {
		const { from } = normalizeMetadataTransforms(
			{ from: [ { type: 'raw', selector: 'hr' } ] },
			'core/separator'
		);

		expect( from ).toHaveLength( 1 );
		expect( from[ 0 ].selector ).toBe( 'hr' );
		expect( from[ 0 ].transform ).toBeUndefined();
	} );

	it( 'builds a transform function when the declaration needs one', () => {
		const { from } = normalizeMetadataTransforms(
			{
				from: [
					{
						type: 'raw',
						selector: 'blockquote',
						sourceAttributes: false,
						innerBlocks: true,
					},
				],
			},
			'core/quote'
		);

		expect( typeof from[ 0 ].transform ).toBe( 'function' );
	} );

	it( 'turns a declared schema into a function of the schema arguments', () => {
		const { from } = normalizeMetadataTransforms(
			{
				from: [
					{ type: 'raw', schema: { p: { children: 'phrasing' } } },
				],
			},
			'core/paragraph'
		);

		const phrasingContentSchema = { b: {} };
		expect(
			from[ 0 ].schema( { phrasingContentSchema, isPaste: false } )
		).toEqual( { p: { children: phrasingContentSchema } } );
	} );

	it( 'expands a block transform naming several blocks into one per block', () => {
		const { to } = normalizeMetadataTransforms(
			{
				to: [
					{
						type: 'block',
						blocks: [ 'core/paragraph', 'core/heading' ],
						attributes: 'all',
					},
				],
			},
			'core/verse'
		);

		expect( to ).toHaveLength( 2 );
		expect( to[ 0 ].blocks ).toEqual( [ 'core/paragraph' ] );
		expect( to[ 1 ].blocks ).toEqual( [ 'core/heading' ] );
	} );
} );

describe( 'block transforms declared in metadata', () => {
	const source = 'test/source';
	const target = 'test/target';

	afterEach( () => {
		[ source, target ].forEach( unregisterBlockType );
	} );

	it( 'carries the declared attributes across a block transform', () => {
		registerBlockType(
			{
				name: target,
				apiVersion: 3,
				attributes: { title: { type: 'string' } },
			},
			{ title: 'Target', category: 'text', save: () => null }
		);

		registerBlockType(
			{
				name: source,
				apiVersion: 3,
				attributes: { heading: { type: 'string' } },
				transforms: {
					to: [
						{
							type: 'block',
							blocks: [ target ],
							attributes: { title: 'heading' },
						},
					],
				},
			},
			{ title: 'Source', category: 'text', save: () => null }
		);

		const [ transform ] = getBlockType( source ).transforms.to;
		const result = transform.transform( { heading: 'Hello' }, [] );

		expect( result.name ).toBe( target );
		expect( result.attributes.title ).toBe( 'Hello' );
	} );
} );

describe( 'transforms declared in metadata after a server bootstrap', () => {
	const name = 'test/bootstrapped';

	afterEach( () => {
		unregisterBlockType( name );
	} );

	it( 'keeps declared transforms the server does not send', () => {
		/*
		 * The store keeps a server-provided definition over a client one, and
		 * `get_block_editor_server_block_settings()` sends no transforms. A
		 * block registered after that bootstrap must still get them.
		 */
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'Bootstrapped',
				category: 'text',
				attributes: {},
			},
		} );

		registerBlockType(
			{
				name,
				apiVersion: 3,
				attributes: {},
				transforms: {
					from: [ { type: 'raw', selector: 'aside' } ],
				},
			},
			{ title: 'Bootstrapped', category: 'text', save: () => null }
		);

		const [ transform ] = getBlockType( name ).transforms.from;

		expect( transform.type ).toBe( 'raw' );
		expect( transform.selector ).toBe( 'aside' );
	} );

	it( 'normalizes the transforms a server does send', () => {
		/*
		 * A block registered from a name alone keeps the server definition, so
		 * the transforms it carries have to be runnable by the time they reach
		 * the block type.
		 */
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'Bootstrapped',
				category: 'text',
				attributes: {},
				transforms: {
					from: [
						{
							type: 'raw',
							selector: 'aside',
							schema: { aside: { children: 'phrasing' } },
						},
					],
					to: [
						{
							type: 'block',
							blocks: [ 'core/paragraph', 'core/heading' ],
							attributes: 'all',
						},
					],
				},
			},
		} );

		registerBlockType( name, {
			title: 'Bootstrapped',
			category: 'text',
			save: () => null,
		} );

		const { transforms } = getBlockType( name );

		expect( transforms.from[ 0 ].selector ).toBe( 'aside' );
		expect(
			transforms.from[ 0 ].schema( {
				phrasingContentSchema: { em: {} },
				isPaste: false,
			} )
		).toEqual( { aside: { children: { em: {} } } } );

		// One transform per block, because the editor does not tell a transform
		// which of them it was chosen for.
		expect( transforms.to ).toHaveLength( 2 );
		expect( transforms.to[ 0 ].blocks ).toEqual( [ 'core/paragraph' ] );
		expect( typeof transforms.to[ 0 ].transform ).toBe( 'function' );
	} );

	it( 'takes transforms from a bootstrap of their own', () => {
		/*
		 * What the plugin does on the WordPress versions whose
		 * `get_block_editor_server_block_settings()` does not send the field:
		 * the editor screen bootstraps the block, and a second call adds the
		 * transforms without disturbing anything the first one carried.
		 */
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'Bootstrapped',
				category: 'text',
				attributes: {},
			},
		} );

		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				transforms: { from: [ { type: 'raw', selector: 'aside' } ] },
			},
		} );

		registerBlockType( name, {
			title: 'Bootstrapped',
			category: 'text',
			save: () => null,
		} );

		const blockType = getBlockType( name );

		expect( blockType.title ).toBe( 'Bootstrapped' );
		expect( blockType.transforms.from[ 0 ].selector ).toBe( 'aside' );
	} );

	it( 'keeps a field the second bootstrap disagrees about', () => {
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'From the server',
				category: 'text',
				attributes: {},
			},
		} );

		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: { title: 'Later', category: 'widgets' },
		} );

		registerBlockType( name, {
			title: 'From the server',
			category: 'text',
			save: () => null,
		} );

		expect( getBlockType( name ).category ).toBe( 'text' );
	} );
} );
