/**
 * External dependencies
 */
import { equal } from 'assert';

function trimWhitespace( string ) {
	return string.replace( /(  +)|\n|\t/g, '' );
}

function wrapInP( string ) {
	return `<p>${ string }</p>`;
}

function withEmptyP( string ) {
	return `<p></p>${ string }`;
}

/**
 * Internal dependencies
 */
import specialCommentConverter from '../special-comment-converter';
import { deepFilterHTML } from '../utils';

describe( 'specialCommentConverter', () => {
	it( 'should convert a single comment into a basic block', () => {
		equal(
			deepFilterHTML( wrapInP(
				'<!--more-->'
			), [ specialCommentConverter ] ),
			withEmptyP( '<wp-block data-block="core/more"></wp-block>' )
		);
	} );
	it( 'should convert two comments into a block', () => {
		equal(
			deepFilterHTML( wrapInP(
				'<!--more--><!--noteaser-->'
			), [ specialCommentConverter ] ),
			withEmptyP( '<wp-block data-block="core/more" data-no-teaser=""></wp-block>' )
		);
	} );
	it( 'should pass custom text to the block', () => {
		equal(
			deepFilterHTML( wrapInP(
				'<!--more Read all about it!--><!--noteaser-->'
			), [ specialCommentConverter ]
			),
			withEmptyP( '<wp-block data-block="core/more" data-custom-text="Read all about it!" data-no-teaser=""></wp-block>' )
		);
	} );
	it( 'should not break content order', () => {
		const output = deepFilterHTML(
			`<p>First paragraph.<!--more--></p>
			<p>Second paragraph</p>
			<p>Third paragraph</p>`,
			[ specialCommentConverter ]
		);
		equal(
			trimWhitespace( output ),
			trimWhitespace( `<p>First paragraph.</p>
			<wp-block data-block=\"core/more\"></wp-block>
			<p>Second paragraph</p>
			<p>Third paragraph</p>` )
		);
	} );

	describe( 'when tags have been reformatted', () => {
		it( 'should parse special comments', () => {
			const output = deepFilterHTML(
				`<p>
					<!--more-->
					<!--noteaser-->
				</p>`,
				[ specialCommentConverter ]
			);
			equal(
				trimWhitespace( output ),
				withEmptyP( '<wp-block data-block="core/more" data-no-teaser=""></wp-block>' )
			);
		} );
		it( 'should not break content order', () => {
			const output = deepFilterHTML(
				`<p>First paragraph.</p>
				<p><!--more--></p>
				<p>Second paragraph</p>
				<p>Third paragraph</p>`,
				[ specialCommentConverter ]
			);
			equal(
				trimWhitespace( output ),
				trimWhitespace( `<p>First paragraph.</p>
				<p></p>
				<wp-block data-block=\"core/more\"></wp-block>
				<p>Second paragraph</p>
				<p>Third paragraph</p>` )
			);
		} );
	} );
} );
