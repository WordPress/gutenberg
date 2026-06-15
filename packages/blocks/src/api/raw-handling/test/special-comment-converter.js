/**
 * Internal dependencies
 */
import specialCommentConverter from '../special-comment-converter';
import { deepFilterHTML } from '../utils';

describe( 'specialCommentConverter', () => {
	it( 'should convert a single "more" comment into a basic block', () => {
		expect(
			deepFilterHTML( '<p><!--more--></p>', [ specialCommentConverter ] )
		).toEqual( '<wp-block data-block="core/more"></wp-block>' );
	} );
	it( 'should convert a single "nextpage" comment into a basic block', () => {
		expect(
			deepFilterHTML( '<p><!--nextpage--></p>', [
				specialCommentConverter,
			] )
		).toEqual( '<wp-block data-block="core/nextpage"></wp-block>' );
	} );
	it( 'should convert two comments into a block', () => {
		expect(
			deepFilterHTML( '<p><!--more--><!--noteaser--></p>', [
				specialCommentConverter,
			] )
		).toEqual(
			'<wp-block data-block="core/more" data-no-teaser=""></wp-block>'
		);
	} );
	it( 'should pass custom text to the block', () => {
		expect(
			deepFilterHTML(
				'<p><!--more Read all about it!--><!--noteaser--></p>',
				[ specialCommentConverter ]
			)
		).toEqual(
			'<wp-block data-block="core/more" data-custom-text="Read all about it!" data-no-teaser=""></wp-block>'
		);
	} );
	it( 'should not break content order', () => {
		const output = deepFilterHTML(
			`<p>First paragraph.<!--more--></p>
			<p>Second paragraph</p>
			<p>Third paragraph</p>`,
			[ specialCommentConverter ]
		);
		expect( output ).toEqual(
			`<p>First paragraph.</p><wp-block data-block=\"core/more\"></wp-block>
			<p>Second paragraph</p>
			<p>Third paragraph</p>`
		);
	} );
	describe( 'when more comment is inside paragraph', () => {
		it( 'should split the paragraph', () => {
			const output = deepFilterHTML(
				`<p>First part<!--more-->second part</p>`,
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				`<p>First part</p><wp-block data-block=\"core/more\"></wp-block><p>second part</p>`
			);
		} );
		it( 'should preserve inline formatting', () => {
			const output = deepFilterHTML(
				`<p><em>First <span>part</span></em><!--more-->second part, some more <u>text</u>.</p>`,
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				`<p><em>First <span>part</span></em></p><wp-block data-block=\"core/more\"></wp-block><p>second part, some more <u>text</u>.</p>`
			);
		} );
		it( 'should position the more block first', () => {
			const output = deepFilterHTML(
				`<p><!--more-->First paragraph.</p>`,
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				`<wp-block data-block=\"core/more\"></wp-block><p>First paragraph.</p>`
			);
		} );
		it( 'should position the more block last', () => {
			const output = deepFilterHTML(
				`<p>First paragraph.<!--more--></p>`,
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				`<p>First paragraph.</p><wp-block data-block=\"core/more\"></wp-block>`
			);
		} );
	} );

	describe( 'when tags have been reformatted', () => {
		it( 'should parse special comments', () => {
			const output = deepFilterHTML(
				'<p><!--more--><!--noteaser--></p>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<wp-block data-block="core/more" data-no-teaser=""></wp-block>'
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
			expect( output ).toEqual(
				`<p>First paragraph.</p>
				<wp-block data-block=\"core/more\"></wp-block>
				<p>Second paragraph</p>
				<p>Third paragraph</p>`
			);
		} );
		it( 'should not break pagination order', () => {
			const output = deepFilterHTML(
				`<p>First page.</p>
				<p><!--nextpage--></p>
				<p>Second page</p>
				<p><!--nextpage--></p>
				<p>Third page</p>`,
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				`<p>First page.</p>
				<wp-block data-block=\"core/nextpage\"></wp-block>
				<p>Second page</p>
				<wp-block data-block=\"core/nextpage\"></wp-block>
				<p>Third page</p>`
			);
		} );
	} );
} );
