/**
 * External dependencies
 */
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import {
	createNewPost,
	saveDraft,
	insertBlock,
} from '@wordpress/e2e-test-utils';

function readFile( filePath ) {
	return existsSync( filePath )
		? readFileSync( filePath, 'utf8' ).trim()
		: '';
}

describe( 'Performance', () => {
	it( '1000 paragraphs', async () => {
		const html = readFile(
			join( __dirname, '../../assets/large-post.html' )
		);

		await createNewPost();
		await page.evaluate( ( _html ) => {
			const { parse } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = parse( _html );

			blocks.forEach( ( block ) => {
				if ( block.name === 'core/image' ) {
					delete block.attributes.id;
					delete block.attributes.url;
				}
			} );

			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		}, html );
		await saveDraft();

		const results = {
			load: [],
			domcontentloaded: [],
			type: [],
		};

		let i = 1;
		let startTime;

		await page.on( 'load', () =>
			results.load.push( new Date() - startTime )
		);
		await page.on( 'domcontentloaded', () =>
			results.domcontentloaded.push( new Date() - startTime )
		);

		while ( i-- ) {
			startTime = new Date();
			await page.reload( { waitUntil: [ 'domcontentloaded', 'load' ] } );
		}

		await insertBlock( 'Paragraph' );

		i = 200;

		while ( i-- ) {
			startTime = new Date();
			await page.keyboard.type( 'x' );
			results.type.push( new Date() - startTime );
		}

		writeFileSync(
			__dirname + '/results.json',
			JSON.stringify( results, null, 2 )
		);

		expect( true ).toBe( true );
	} );
} );
