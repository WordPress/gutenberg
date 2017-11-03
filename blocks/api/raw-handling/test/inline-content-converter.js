/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import inlineContentConverter from '../inline-content-converter';
import { deepFilterHTML } from '../utils';

describe( 'inlineContentConverter', () => {
	it( 'should remove non-inline content from inline wrapper', () => {
		equal(
			deepFilterHTML( '<figcaption><p>test</p><p>test</p></figcaption>', [ inlineContentConverter ] ),
			'<figcaption>test<br>test</figcaption>'
		);
	} );
} );
