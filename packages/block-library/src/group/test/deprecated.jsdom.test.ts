import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	getBlockType,
	getBlockTypes,
	parse,
	serialize,
	unstable__bootstrapServerSideBlockDefinitions as bootstrapServerSideBlockDefinitions,
	unregisterBlockType,
} from '@wordpress/blocks';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';
import metadata from '../block.json';

const customAttributes = {
	customObject: { nested: [ 'value', false, 0 ] },
	customString: 'custom value',
	customBoolean: false,
	customNumber: 0,
};

describe( 'server-registered attributes in deprecated blocks', () => {
	beforeAll( () => {
		// The server bootstraps the metadata after block_type_metadata filters
		// have run. Do not use a client filter, which also changes deprecations.
		bootstrapServerSideBlockDefinitions( {
			'core/group': {
				...metadata,
				attributes: {
					...metadata.attributes,
					customObject: { type: 'object' },
					customString: { type: 'string' },
					customBoolean: { type: 'boolean' },
					customNumber: { type: 'number' },
				},
			},
		} );
		registerCoreBlocks();
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it.each<
		[
			string,
			Record< string, unknown >,
			boolean,
			Record< string, unknown > | undefined,
		]
	>( [
		[
			'legacy content size',
			{ layout: { inherit: false, contentSize: '200px' } },
			false,
			{ inherit: false, contentSize: '200px', type: 'constrained' },
		],
		[ 'legacy inner container', {}, true, undefined ],
		[
			'current layout',
			{ layout: { type: 'constrained' } },
			false,
			{ type: 'constrained' },
		],
		[ 'current markup without layout', {}, false, undefined ],
	] )(
		'preserves custom attributes with %s',
		( _description, attributes, legacyContainer, expectedLayout ) => {
			const paragraph =
				'<!-- wp:paragraph --><p>Group content</p><!-- /wp:paragraph -->';
			const children = legacyContainer
				? `<div class="wp-block-group__inner-container">${ paragraph }</div>`
				: paragraph;
			const content = `<!-- wp:group ${ JSON.stringify( { ...attributes, ...customAttributes } ) } --><div class="wp-block-group">${ children }</div><!-- /wp:group -->`;
			const [ block ] = parse( content, {
				__unstableSkipMigrationLogs: true,
			} );

			expect( getBlockType( 'core/group' )?.attributes ).toMatchObject( {
				customObject: { type: 'object' },
			} );
			expect( block.isValid ).toBe( true );
			expect( block.attributes ).toMatchObject( customAttributes );
			expect( block.attributes.layout ).toEqual( expectedLayout );
			expect( block.innerBlocks ).toHaveLength( 1 );
			expect( block.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( String( block.innerBlocks[ 0 ].attributes.content ) ).toBe(
				'Group content'
			);
			const [ reparsedBlock ] = parse( serialize( [ block ] ) );
			expect( reparsedBlock.isValid ).toBe( true );
			expect( reparsedBlock.attributes ).toMatchObject(
				customAttributes
			);
		}
	);
} );
