( function( QUnit ) {
	var wordCounter = new window.wp.utils.WordCounter();

	QUnit.module( 'word-count' );

	QUnit.test( 'All.', function( assert ) {
		var tests = [
			{
				message: 'Basic test.',
				string: 'one two three',
				wordCount: 3,
				charCount: 11
			},
			{
				message: 'HTML tags.',
				string: 'one <em class="test">two</em><br />three',
				wordCount: 3,
				charCount: 11
			},
			{
				message: 'Line breaks.',
				string: 'one\ntwo\nthree',
				wordCount: 3,
				charCount: 11
			},
			{
				message: 'Encoded spaces.',
				string: 'one&nbsp;two&#160;three',
				wordCount: 3,
				charCount: 11
			},
			{
				message: 'Punctuation.',
				string: 'It\'s two three... 4?',
				wordCount: 3,
				charCount: 11
			}
		];

		var i = tests.length;

		while ( i-- ) {
			assert.equal( wordCounter.count( tests[ i ].string ), tests[ i ].wordCount, tests[ i ].message + ' (words)' );
			assert.equal( wordCounter.count( tests[ i ].string, 'characters' ), tests[ i ].charCount, tests[ i ].message + ' (characters)' );
		}
	} );
} )( window.QUnit );
