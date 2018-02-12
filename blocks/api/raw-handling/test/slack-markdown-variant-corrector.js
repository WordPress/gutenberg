/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import slackMarkdownVariantCorrector from '../slack-markdown-variant-corrector';

describe( 'slackMarkdownVariantCorrector', () => {
	it( 'should correct Slack variant', () => {
		equal( slackMarkdownVariantCorrector( '```test```' ), '```\ntest\n```' );
	} );

	it( 'should correct Slack variant on own line', () => {
		equal( slackMarkdownVariantCorrector( 'test\n```test```\ntest' ), 'test\n```\ntest\n```\ntest' );
	} );

	it( 'should not correct inline code', () => {
		const text = 'test ```test``` test';
		equal( slackMarkdownVariantCorrector( text ), text );
	} );

	it( 'should not correct code with line breaks', () => {
		const text = '```js\ntest\n```';
		equal( slackMarkdownVariantCorrector( text ), text );
	} );
} );
