import { describe, it } from 'mocha';
import { deepEqual } from 'assert';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM();
const { document } = window;

import { toState } from '../state';

function createNode( HTML ) {
	document.body.innerHTML = HTML;
	return document.body.firstChild;
}

describe( 'toState', () => {
	it( 'should extract text with formats', () => {
		const node = createNode( '<p>one <em>two</em> <a href="#"><strong>three<strong></a></p>' );
		const range = {
			startOffset: 1,
			startContainer: node.querySelector( 'em' ).firstChild,
			endOffset: 0,
			endContainer: node.lastChild,
		};

		deepEqual( toState( node, range, { inline: true } ), {
			value: {
				formats: {
					4: [ { type: 'em' } ],
					5: [ { type: 'em' } ],
					6: [ { type: 'em' } ],
					8: [ { type: 'strong' }, { type: 'a', href: '#' } ],
					9: [ { type: 'strong' }, { type: 'a', href: '#' } ],
					10: [ { type: 'strong' }, { type: 'a', href: '#' } ],
					11: [ { type: 'strong' }, { type: 'a', href: '#' } ],
					12: [ { type: 'strong' }, { type: 'a', href: '#' } ],
				},
				text: 'one two three',
			},
			selection: {
				start: 5,
				end: 8,
			},
		} );
	} );

	it( 'should extract multiline text', () => {
		const node = createNode( '<div><p>one <em>two</em> three</p><p>test</p></div>' );

		deepEqual( toState( node, {}, { inline: false } ), {
			value: [
				{
					attributes: {},
					formats: {
						4: [ { type: 'em' } ],
						5: [ { type: 'em' } ],
						6: [ { type: 'em' } ],
					},
					text: 'one two three',
				},
				{
					attributes: {},
					formats: {},
					text: 'test',
				},
			],
			selection: {},
		} );
	} );

	// it( 'should extract text with formats', () => {
	// 	const { node, range } = toChildNodes( {
	// 		value: {
	// 			formats: [
	// 				{ type: 'em', start: 4, end: 7 },
	// 			],
	// 			text: 'one two three',
	// 		},
	// 		selection: {
	// 			start: 5,
	// 			end: 7,
	// 		},
	// 	} );

	// 	deepEqual( node.innerHTML, '<p>one <em>two</em> three</p>' );
	// 	deepEqual( range, {
	// 		startOffset: 1,
	// 		startContainer: node.querySelector( 'em' ).firstChild,
	// 		endOffset: 0,
	// 		endContainer: node.lastChild,
	// 	} );
	// } );
} );
