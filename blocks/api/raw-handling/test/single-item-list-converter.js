/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import singleItemListConverter from '../single-item-list-converter';
import { deepFilterHTML } from '../utils';

describe( 'singleItemListConverter', () => {
	it( 'should treat a single-item list as a paragraph', () => {
		const input = '<ul><li>Lorem ipsum, dolor sit amet.</li></ul>';
		const output = '<p>Lorem ipsum, dolor sit amet.</p>';
		equal( deepFilterHTML( input, [ singleItemListConverter ] ), output );
	} );
	it( 'shouldn\'t affect multi-item lists', () => {
		const input = '<ul><li>Lorem ipsum</li><li>Dolor sit amet</li></ul>';
		equal( deepFilterHTML( input, [ singleItemListConverter ] ), input );
	} );
	it( 'should squash single-item nested lists', () => {
		const input = '<ul><ul><li>Lorem ipsum</li></ul></ul>';
		const output = '<p>Lorem ipsum</p>';
		equal( deepFilterHTML( input, [ singleItemListConverter ] ), output );
	} );
	it( 'shouldn\'t squash multi-item nested lists', () => {
		const input = '<ul><ul><li>Lorem ipsum</li><li>Dolor sit amet</li></ul></ul>';
		equal( deepFilterHTML( input, [ singleItemListConverter ] ), input );
	} );
	it( 'shouldn\'t affect valid nested lists', () => {
		const input = `
<ul>
    <li>A</li>
    <li>Bulleted</li>
    <ul>
        <li>Indented</li>
    </ul>
    <li>List</li>
</ul>`;
		equal( deepFilterHTML( input, [ singleItemListConverter ] ), input );
	} );
} );
