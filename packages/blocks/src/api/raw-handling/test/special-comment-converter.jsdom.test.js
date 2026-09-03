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
	it( 'should keep a comment that is not inside a paragraph', () => {
		expect(
			deepFilterHTML( '<p>First</p><!--more--><p>Second</p>', [
				specialCommentConverter,
			] )
		).toEqual(
			'<p>First</p><wp-block data-block="core/more"></wp-block><p>Second</p>'
		);
	} );
	it( 'should keep a comment between text', () => {
		expect(
			deepFilterHTML( 'First<!--more-->Second', [
				specialCommentConverter,
			] )
		).toEqual( 'First<wp-block data-block="core/more"></wp-block>Second' );
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

	describe( 'when the comment is inside another container', () => {
		it( 'should split the container around the block', () => {
			const output = deepFilterHTML(
				'<div>First<!--more-->Second</div>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<div>First</div><wp-block data-block="core/more"></wp-block><div>Second</div>'
			);
		} );
		it( 'should keep the container markup on both halves', () => {
			const output = deepFilterHTML(
				'<div class="wrap">First<!--more-->Second</div>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<div class="wrap">First</div><wp-block data-block="core/more"></wp-block><div class="wrap">Second</div>'
			);
		} );
		it( 'should build the halves of a paragraph bare', () => {
			// As the editor always has: `createElement( 'p' )`, so an `id`
			// does not turn into a duplicate DOM id on every half.
			const output = deepFilterHTML(
				'<p id="intro">First<!--more-->Second</p>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<p>First</p><wp-block data-block="core/more"></wp-block><p>Second</p>'
			);
		} );
		it( 'should split every container up to the top level', () => {
			const output = deepFilterHTML(
				'<section><div><h2>a</h2><!--more--><h2>b</h2></div></section>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<section><div><h2>a</h2></div></section><wp-block data-block="core/more"></wp-block><section><div><h2>b</h2></div></section>'
			);
		} );
		it( 'should drop a half that would be empty', () => {
			expect(
				deepFilterHTML( '<div><!--more--></div>', [
					specialCommentConverter,
				] )
			).toEqual( '<wp-block data-block="core/more"></wp-block>' );
		} );
		it( 'should split one container around two blocks', () => {
			const output = deepFilterHTML(
				'<div>a<!--more-->b<!--nextpage-->c</div>',
				[ specialCommentConverter ]
			);
			expect( output ).toEqual(
				'<div>a</div><wp-block data-block="core/more"></wp-block><div>b</div><wp-block data-block="core/nextpage"></wp-block><div>c</div>'
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
