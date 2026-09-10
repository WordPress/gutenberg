import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockAttributesNamesByRole,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import metadata from '../block.json';
import deprecated from '../deprecated';
import save from '../save';

const { name } = metadata;

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const MIRROR_URL = 'https://vimeo.com/668136661';
const SECOND_MIRROR_URL = 'https://tube.example/w/abc123';

const videoAttributes = {
	url: VIDEO_URL,
	type: 'video',
	providerNameSlug: 'youtube',
};

// The markup an embed block has always saved, before fallback URLs existed.
const SAVED_WITHOUT_FALLBACKS = [
	`<!-- wp:embed {"url":"${ VIDEO_URL }","type":"video","providerNameSlug":"youtube"} -->`,
	'<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube"><div class="wp-block-embed__wrapper">',
	VIDEO_URL,
	'</div></figure>',
	'<!-- /wp:embed -->',
].join( '\n' );

describe( 'core/embed fallback URLs', () => {
	beforeAll( () => {
		registerBlockType( { name, ...metadata }, { save, deprecated } );
	} );

	afterAll( () => {
		unregisterBlockType( name );
	} );

	describe( 'saved markup', () => {
		it( 'saves the markup unchanged when no fallback URL is set', () => {
			const block = createBlock( name, videoAttributes );

			// An embed without fallbacks must save byte-identically to how it
			// saved before the attribute existed, so nothing is invalidated.
			expect( serialize( block ) ).toBe( SAVED_WITHOUT_FALLBACKS );
		} );

		it( 'saves the fallback URLs on the wrapper, separated by spaces', () => {
			const block = createBlock( name, {
				...videoAttributes,
				fallbacks: [ MIRROR_URL, SECOND_MIRROR_URL ],
			} );

			expect( serialize( block ) ).toBe(
				[
					`<!-- wp:embed {"url":"${ VIDEO_URL }","type":"video","providerNameSlug":"youtube","fallbacks":["${ MIRROR_URL }","${ SECOND_MIRROR_URL }"]} -->`,
					`<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube" data-fallbacks="${ MIRROR_URL } ${ SECOND_MIRROR_URL }"><div class="wp-block-embed__wrapper">`,
					VIDEO_URL,
					'</div></figure>',
					'<!-- /wp:embed -->',
				].join( '\n' )
			);
		} );

		it( 'keeps a fallback URL that contains a comma intact', () => {
			// Commas are legitimate in URLs (YouTube playlist parameters, for
			// one), which is why the saved list is separated by spaces.
			const playlistURL =
				'https://www.youtube.com/watch_videos?video_ids=dQw4w9WgXcQ,5YDT4RLPIgA';
			const block = createBlock( name, {
				...videoAttributes,
				fallbacks: [ playlistURL, MIRROR_URL ],
			} );

			expect( serialize( block ) ).toContain(
				`data-fallbacks="${ playlistURL } ${ MIRROR_URL }"`
			);
		} );

		it( 'saves no markup at all when the block has no URL', () => {
			const block = createBlock( name, {
				fallbacks: [ MIRROR_URL ],
			} );

			expect( serialize( block ) ).toBe(
				`<!-- wp:embed {"fallbacks":["${ MIRROR_URL }"]} /-->`
			);
		} );
	} );

	describe( 'parsing', () => {
		it( 'still validates embeds saved before fallback URLs existed', () => {
			const [ block ] = parse( SAVED_WITHOUT_FALLBACKS );

			expect( block.isValid ).toBe( true );
			expect( block.attributes.fallbacks ).toEqual( [] );
		} );

		it( 'validates and restores an embed saved with fallback URLs', () => {
			const [ block ] = parse(
				serialize(
					createBlock( name, {
						...videoAttributes,
						fallbacks: [ MIRROR_URL, SECOND_MIRROR_URL ],
					} )
				)
			);

			expect( block.isValid ).toBe( true );
			expect( block.attributes.fallbacks ).toEqual( [
				MIRROR_URL,
				SECOND_MIRROR_URL,
			] );
		} );
	} );

	describe( 'attribute definition', () => {
		it( 'defaults to an empty list', () => {
			expect( createBlock( name, videoAttributes ).attributes ).toEqual(
				expect.objectContaining( { fallbacks: [] } )
			);
		} );

		it( 'is content, so content-only editing and pattern overrides reach it', () => {
			expect(
				getBlockAttributesNamesByRole( name, 'content' )
			).toContain( 'fallbacks' );
		} );
	} );
} );
