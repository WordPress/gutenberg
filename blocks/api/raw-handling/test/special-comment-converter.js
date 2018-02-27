/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import specialCommentConverter from '../special-comment-converter';
import { deepFilterHTML } from '../utils';

describe( 'specialCommentConverter', () => {
	it( 'should convert a single comment into a basic block', () => {
		equal(
			deepFilterHTML( '<!--more-->', [ specialCommentConverter ] ),
			'<wp-block data-block="core/more"></wp-block>'
		);
	} );
	it( 'should convert two comments into a block', () => {
		equal(
			deepFilterHTML( '<!--more--><!--noteaser-->', [ specialCommentConverter ] ),
			'<wp-block data-block="core/more" data-no-teaser=""></wp-block>'
		);
	} );
	it( 'should pass custom text to the block', () => {
		equal(
			deepFilterHTML(
				'<!--more Read all about it!--><!--noteaser-->',
				[ specialCommentConverter ]
			),
			'<wp-block data-block="core/more" data-custom-text="Read all about it!" data-no-teaser=""></wp-block>'
		);
	} );
	it( 'should handle reformatted content', () => {
		const output = deepFilterHTML(
			`<p>
				<!--more-->
				<!--noteaser-->
			</p>`,
			[ specialCommentConverter ]
		);
		// Skip the empty paragraph, which other transforms would eliminate
		const start = output.indexOf( '</p>' ) + '</p>'.length;
		equal(
			output.substr( start ),
			'<wp-block data-block="core/more" data-no-teaser=""></wp-block>'
		);
	} );
} );
