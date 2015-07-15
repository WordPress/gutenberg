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
				string: 'It\'s two three... 4?',
				words: 3,
				characters: 11,
				all: 14
			}
		], function( test ) {
			_.each( [ 'words', 'characters', 'all' ], function( type ) {
				assert.equal( wordCounter.count( test.string, type ), test[ type ], test.message + ' (' + type + ')' );
			} );
		} );
	} );
} )( window.QUnit, new window.wp.utils.WordCounter() );
