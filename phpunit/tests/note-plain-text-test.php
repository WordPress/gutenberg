<?php
/**
 * Tests for the plain text conversion of note content.
 *
 * @group notes
 */
class Tests_Notes_Plain_Text extends WP_UnitTestCase {

	/**
	 * @covers ::gutenberg_get_note_plain_text
	 *
	 * @dataProvider data_get_note_plain_text
	 *
	 * @param string $content  Note content, as stored.
	 * @param string $expected The plain text of the note.
	 */
	public function test_get_note_plain_text( string $content, string $expected ): void {
		$this->assertSame( $expected, gutenberg_get_note_plain_text( $content ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{string, string}>
	 */
	public function data_get_note_plain_text(): array {
		return array(
			'a mention chip'      => array( 'Hi <span class="wp-note-mention user-7">@Reviewer</span>!', 'Hi @Reviewer!' ),
			'line breaks'         => array( 'Fix the intro.<br>Then publish.<br />', "Fix the intro.\nThen publish." ),
			'inline formats'      => array( 'A <strong>bold</strong> <a href="https://example.com/">link</a> and <code>code</code>.', 'A bold link and code.' ),
			'escaped text'        => array( 'Rename &lt;code&gt; to &lt;kbd&gt;.', 'Rename <code> to <kbd>.' ),
			'plain text'          => array( 'Just text.', 'Just text.' ),
			'a resolve or reopen' => array( '', '' ),
		);
	}
}
