( function( QUnit, wordCounter ) {
	QUnit.module( 'word-count' );

	QUnit.test( 'All.', function( assert ) {
		_.each( [
			{
				message: 'Basic test.',
				string: 'one two three',
				words: 3,
				characters_excluding_spaces: 11,
				characters_including_spaces: 13
			},
			{
				message: 'HTML tags.',
				string: 'one <em class="test">two</em><br />three',
				words: 3,
				characters_excluding_spaces: 11,
				characters_including_spaces: 12
			},
			{
				message: 'Line breaks.',
				string: 'one\ntwo\nthree',
				words: 3,
				characters_excluding_spaces: 11,
				characters_including_spaces: 11
			},
			{
				message: 'Encoded spaces.',
				string: 'one&nbsp;two&#160;three',
				words: 3,
				characters_excluding_spaces: 11,
				characters_including_spaces: 13
			},
			{
				message: 'Punctuation.',
				string: 'It\'s two three \u2026 4?',
				words: 3,
				characters_excluding_spaces: 15,
				characters_including_spaces: 19
			},
			{
				message: 'Em dash.',
				string: 'one\u2014two--three',
				words: 3,
				characters_excluding_spaces: 14,
				characters_including_spaces: 14
			},
			{
				message: 'Shortcodes.',
				string: 'one [shortcode attribute="value"]two[/shortcode]three',
				words: 3,
				characters_excluding_spaces: 11,
				characters_including_spaces: 12
			},
			{
				message: 'Astrals.',
				string: '\uD83D\uDCA9',
				words: 1,
				characters_excluding_spaces: 1,
				characters_including_spaces: 1
			},
			{
				message: 'HTML comment.',
				string: 'one<!-- comment -->two three',
				words: 2,
				characters_excluding_spaces: 11,
				characters_including_spaces: 12
			},
			{
				message: 'HTML entity.',
				string: '&gt; test',
				words: 1,
				characters_excluding_spaces: 5,
				characters_including_spaces: 6
			}
		], function( test ) {
			_.each( [ 'words', 'characters_excluding_spaces', 'characters_including_spaces' ], function( type ) {
				assert.equal( wordCounter.count( test.string, type ), test[ type ], test.message + ' (' + type + ')' );
			} );
		} );
	} );
} )( window.QUnit, new window.wp.utils.WordCounter( {
	l10n: {
		shortcodes: [ 'shortcode' ]
	}
} ) );
