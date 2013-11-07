/* global passwordStrength, wp, jQuery */
jQuery( function() {
	module( 'password-strength-meter' );

	test( 'mismatched passwords should return 5', function() {
		equal( passwordStrength( 'password1', 'username', 'password2' ), 5, 'mismatched passwords return 5' );
	});

	test( 'passwords shorter than 4 characters should return 0', function() {
		equal( passwordStrength( 'abc', 'username', 'abc' ), 0, 'short passwords return 0' );
	});

	test( 'long complicated passwords should return 4', function() {
		var password = function( length ) {
			var i, n, retVal = '',
				possibility = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
			for ( i = 0, n = possibility.length; i < length; i++ ) {
				retVal += possibility.charAt( Math.floor( Math.random() * n ) );
			}
			return retVal + 'aB2'; // add a lower case, uppercase and number just to make sure we always have one of each
		},
		twofifty = password( 250 );

		equal( passwordStrength( twofifty, 'username', twofifty ), 4, '250 character complicated password returns 4' );
	});

	test( 'short uncomplicated passwords should return 0', function() {
		var letters = 'aaaa',
			numbers = '1111',
			password = 'password',
			uppercase = 'AAAA';
		equal( passwordStrength( letters, 'username', letters ), 0, 'password of `' + letters + '` returns 0' );
		equal( passwordStrength( numbers, 'username', numbers ), 0, 'password of `' + numbers + '` returns 0' );
		equal( passwordStrength( uppercase, 'username', uppercase ), 0, 'password of `' + uppercase + '` returns 0' );
		equal( passwordStrength( password, 'username', password ), 0, 'password of `' + password + '` returns 0' );
	});

	test( 'zxcvbn password tests should return the score we expect', function() {
		var passwords, i;
		passwords = [
			{ pw: 'zxcvbn', score: 0 },
			{ pw: 'qwER43@!', score: 1 },
			{ pw: 'Tr0ub4dour&3', score: 2 },
			{ pw: 'correcthorsebatterystaple', score: 4 },
			{ pw: 'coRrecth0rseba++ery9.23.2007staple$', score: 4 },
			{ pw: 'D0g..................', score: 0 },
			{ pw: 'abcdefghijk987654321', score: 0 },
			{ pw: 'neverforget13/3/1997', score: 2 },
			{ pw: '1qaz2wsx3edc', score: 0 },
			{ pw: 'temppass22', score: 1 },
			{ pw: 'briansmith', score: 0 },
			{ pw: 'briansmith4mayor', score: 0 },
			{ pw: 'password1', score: 0 },
			{ pw: 'viking', score: 0 },
			{ pw: 'thx1138', score: 0 },
			{ pw: 'ScoRpi0ns', score: 0 },
			{ pw: 'do you know', score: 0 },
			{ pw: 'ryanhunter2000', score: 0 },
			{ pw: 'rianhunter2000', score: 1 },
			{ pw: 'asdfghju7654rewq', score: 2 },
			{ pw: 'AOEUIDHG&*()LS_', score: 2 },
			{ pw: '12345678', score: 0 },
			{ pw: 'defghi6789', score: 0 },
			{ pw: 'rosebud', score: 0 },
			{ pw: 'Rosebud', score: 0 },
			{ pw: 'ROSEBUD', score: 0 },
			{ pw: 'rosebuD', score: 0 },
			{ pw: 'ros3bud99', score: 0 },
			{ pw: 'r0s3bud99', score: 0 },
			{ pw: 'R0$38uD99', score: 1 },
			{ pw: 'verlineVANDERMARK', score: 1 },
			{ pw: 'eheuczkqyq', score: 4 },
			{ pw: 'rWibMFACxAUGZmxhVncy', score: 4 },
			{ pw: 'Ba9ZyWABu99[BK#6MBgbH88Tofv)vs$w', score: 4 }
		];

		for ( i = 0; i < passwords.length; i++ ) {
			equal( passwordStrength( passwords[i].pw, 'username', passwords[i].pw ), passwords[i].score, 'password of `' + passwords[i].pw + '` returns ' + passwords[i].score );
		}
	});

	test( 'blacklisted words in password should be penalized', function() {
		var allowedPasswordScore, penalizedPasswordScore,
			allowedPassword   = 'a[janedoe]4',
			penalizedPassword = 'a[johndoe]4',
			blacklist         = [ 'extra', 'johndoe', 'superfluous' ];

		allowedPasswordScore = passwordStrength( allowedPassword, blacklist, allowedPassword );
		penalizedPasswordScore = passwordStrength( penalizedPassword, blacklist, penalizedPassword );

		ok( penalizedPasswordScore < allowedPasswordScore, 'Penalized password scored ' + penalizedPasswordScore + '; allowed password scored: ' + allowedPasswordScore );
	});

	test( 'user input blacklist array should contain expected words', function() {
		var blacklist = wp.passwordStrength.userInputBlacklist();

		ok( jQuery.isArray( blacklist ), 'blacklist is an array' );
		ok( jQuery.inArray( 'WordPress', blacklist ) > -1, 'blacklist contains "WordPress" from page title' );
		ok( jQuery.inArray( 'tests', blacklist ) > -1, 'blacklist contains "tests" from site URL' );
	});
});
