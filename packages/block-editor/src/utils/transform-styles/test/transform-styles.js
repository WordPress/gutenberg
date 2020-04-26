/**
 * External dependencies
 */
import path from 'path';
import { readFileSync } from 'fs';

/*
 * Internal dependencies
 */
import transformStyles from '../index';


describe( 'Transform styles', () => {
	it( 'Should replace html, body and :root selectors with style wrapper class selector', () => {

        const inputCss = readFileSync(
			path.join( __dirname, '/fixtures/input.css' ), 'utf8'
		);
        const rules = [ {
            css: inputCss,
        } ];

        const expectedCss = readFileSync(
			path.join( __dirname, '/fixtures/expected.css' ), 'utf8'
		);
        const expectedRules = [
            expectedCss,
        ];

		const outputRules = transformStyles( rules, 'editor-styles-wrapper' );

		expect( outputRules ).toEqual( expectedRules );
	} );
} );
