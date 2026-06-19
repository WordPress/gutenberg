/**
 * Internal dependencies
 */
import markdownConverter from '../markdown-converter';

describe( 'markdownConverter', () => {
	it( 'should correct Slack variant', () => {
		const input = '```test```';
		const output = '<pre><code>test</code></pre>';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should correct Slack variant on own line', () => {
		const input = 'test\n```test```\ntest';
		const output = '<p>test</p>\n<pre><code>test</code></pre><p>test</p>\n';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should not correct inline code', () => {
		const input = 'test ```test``` test';
		const output = '<p>test <code>test</code> test</p>\n';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should not correct code with line breaks', () => {
		const input = '```js\ntest\n```';
		const output = '<pre><code class="js language-js">test</code></pre>';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should not convert single-line date string into an ordered list', () => {
		const input = '18. May 2021';
		const output = '<p>18. May 2021</p>\n';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should not convert single-line "1. foo" into an ordered list', () => {
		const input = '1. foo';
		const output = '<p>1. foo</p>\n';
		expect( markdownConverter( input ) ).toEqual( output );
	} );

	it( 'should still convert multi-line ordered list', () => {
		const input = '1. apple\n2. banana';
		expect( markdownConverter( input ) ).toContain( '<ol>' );
	} );

	it( 'should convert bullet characters to asterisks', () => {
		const input = '• one\n• two';
		expect( markdownConverter( input ) ).toContain( '<ul>' );
		expect( markdownConverter( input ) ).toContain( '<li>one</li>' );
		expect( markdownConverter( input ) ).toContain( '<li>two</li>' );
	} );

	it( 'should preserve quotes in body text for shortcode matching', () => {
		const input = '[gallery ids="123"]';
		expect( markdownConverter( input ) ).toContain( '[gallery ids="123"]' );
	} );
} );
