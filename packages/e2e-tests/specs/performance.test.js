/**
 * External dependencies
 */

import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import {
	createNewPost,
	saveDraft,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Performance', async () => {
	it( '1000 paragraphs', async () => {
		await createNewPost();
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;

			dispatch( 'core/editor' ).resetBlocks( Array( 1000 ).fill(
				createBlock( 'core/paragraph', {
					content: 'x'.repeat( 200 ),
				} )
			) );
		} );
		await saveDraft();

		const results = {
			load: [],
			domcontentloaded: [],
			type: [],
		};

		let i = 10;
		let startTime;

		await page.on( 'load', () => results.load.push( new Date() - startTime ) );
		await page.on( 'domcontentloaded', () => results.domcontentloaded.push( new Date() - startTime ) );

		while ( i-- ) {
			startTime = new Date();
			await page.reload( { waitUntil: [ 'domcontentloaded', 'load' ] } );
		}

		await insertBlock( 'Paragraph' );

		const keyTimes = [];

		await page.evaluate( ( _keyTimes ) => {
			document.addEventListener( 'keydown', () => _keyTimes.push( new Date() ) );
			document.addEventListener( 'keyup', () => _keyTimes[ _keyTimes.length - 1 ] = new Date() - _keyTimes[ _keyTimes.length - 1 ] );
		}, keyTimes );

		i = 200;

		while ( i-- ) {
			startTime = new Date();
			await page.keyboard.type( 'x' );
			results.type.push( new Date() - startTime );
		}

		writeFileSync( __dirname + '/results.json', JSON.stringify( results, null, 2 ) );

		expect( true ).toBe( true );
	} );
} );
