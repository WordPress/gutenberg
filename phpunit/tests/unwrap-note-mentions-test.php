<?php
/**
 * Tests that the mention chips are unwrapped from note content.
 *
 * @group notes
 */
class Tests_Notes_Unwrap_Mentions extends WP_UnitTestCase {

	/**
	 * @covers ::gutenberg_unwrap_note_mentions
	 *
	 * @dataProvider data_unwrap_note_mentions
	 *
	 * @param string $content  Note content, as stored.
	 * @param string $expected The content with the mention chips unwrapped.
	 */
	public function test_unwrap_note_mentions( string $content, string $expected ): void {
		$this->assertSame( $expected, gutenberg_unwrap_note_mentions( $content ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{string, string}>
	 */
	public function data_unwrap_note_mentions(): array {
		return array(
			'a mention chip'                               => array(
				'Hi <span class="wp-note-mention user-7">@Reviewer</span>!',
				'Hi @Reviewer!',
			),
			'several mention chips'                        => array(
				'<span class="wp-note-mention user-5">@Jane</span> and <span class="wp-note-mention user-9">@Bob</span>',
				'@Jane and @Bob',
			),
			'a chip with more classes'                     => array(
				'<span class="wp-note-mention user-7 is-active">@Reviewer</span>',
				'@Reviewer',
			),
			'a chip in uppercase with single quotes'       => array(
				"<SPAN CLASS='wp-note-mention user-7'>@Reviewer</SPAN>",
				'@Reviewer',
			),
			'a class that only starts with the chip class' => array(
				'<span class="wp-note-mention-like">@Reviewer</span>',
				'<span class="wp-note-mention-like">@Reviewer</span>',
			),
			'formatting inside a chip is kept'             => array(
				'<span class="wp-note-mention user-7"><strong>@Reviewer</strong></span>',
				'<strong>@Reviewer</strong>',
			),
			'a span inside a chip is kept'                 => array(
				'<span class="wp-note-mention user-7">@<span>Reviewer</span></span>',
				'@<span>Reviewer</span>',
			),
			'other spans and tags are left'                => array(
				'<span class="user-7">not a chip</span> <span>plain</span> <strong>bold</strong><br>',
				'<span class="user-7">not a chip</span> <span>plain</span> <strong>bold</strong><br>',
			),
			'text without mentions'                        => array(
				'Just text.',
				'Just text.',
			),
			'an unclosed chip loses its opener'            => array(
				'<span class="wp-note-mention user-7">@Reviewer',
				'@Reviewer',
			),
			'a stray closer after a chip is dropped'       => array(
				'<span class="wp-note-mention user-7">@Reviewer</span></span>',
				'@Reviewer',
			),
			'the rest is written back normalized'          => array(
				"<EM>Hi</EM> <span class='wp-note-mention user-7'>@Reviewer</span> <b>bold",
				'<em>Hi</em> @Reviewer <b>bold</b>',
			),
			'text comes back with the entities the email decodes' => array(
				'Ana &amp; Rui&#8217;s "draft" <span class="wp-note-mention user-7">@Reviewer</span>',
				'Ana &amp; Rui’s "draft" @Reviewer',
			),
		);
	}
}
