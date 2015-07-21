( function( QUnit, wordCounter ) {
	QUnit.module( 'word-count' );

	QUnit.test( 'All.', function( assert ) {
		_.each( [
			{
				message: 'Basic test.',
				string: 'one two three',
				words: 3,
				characters: 11,
				all: 13
			},
			{
				message: 'HTML tags.',
				string: 'one <em class="test">two</em><br />three',
				words: 3,
				characters: 11,
				all: 12
			},
			{
				message: 'Line breaks.',
				string: 'one\ntwo\nthree',
				words: 3,
				characters: 11,
				all: 11
			},
			{
				message: 'Encoded spaces.',
				string: 'one&nbsp;two&#160;three',
				words: 3,
				characters: 11,
				all: 13
			},
			{
				message: 'Punctuation.',
				string: 'It\'s two three \u2026 4?',
				words: 3,
				characters: 15,
				all: 19
			},
			{
				message: 'Em dash.',
				string: 'one\u2014two--three',
				words: 3,
				characters: 14,
				all: 14
			},
			{
				message: 'Shortcodes.',
				string: 'one [shortcode attribute="value"]two[/shortcode]three',
				words: 3,
				characters: 11,
				all: 12
			},
			{
				message: 'Astrals.',
				string: '\uD83D\uDCA9',
				words: 1,
				characters: 1,
				all: 1
			},
			{
				message: 'HTML comment.',
				string: 'one<!-- comment -->two three',
				words: 2,
				characters: 11,
				all: 12
			},
			{
				message: 'HTML entity.',
				string: '&gt; test',
				words: 1,
				characters: 5,
				all: 6
			}
		], function( test ) {
			_.each( [ 'words', 'characters', 'all' ], function( type ) {
				assert.equal( wordCounter.count( test.string, type ), test[ type ], test.message + ' (' + type + ')' );
			} );
		} );
	} );
} )( window.QUnit, new window.wp.utils.WordCounter( {
	l10n: {
		shortcodes: [ 'shortcode' ]
	}
} ) );
