<?php

/**
 * @group formatting
 */
class Tests_Formatting_Smilies extends WP_UnitTestCase {

	function test_convert_smilies() {
		global $wpsmiliestrans;
		$includes_path = includes_url("images/smilies/");

		// standard smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );

		smilies_init();

		$inputs = array(
						'Lorem ipsum dolor sit amet mauris ;-) Praesent gravida sodales. :lol: Vivamus nec diam in faucibus eu, bibendum varius nec, imperdiet purus est, at augue at lacus malesuada elit dapibus a, :eek: mauris. Cras mauris viverra elit. Nam laoreet viverra. Pellentesque tortor. Nam libero ante, porta urna ut turpis. Nullam wisi magna, :mrgreen: tincidunt nec, sagittis non, fringilla enim. Nam consectetuer nec, ullamcorper pede eu dui odio consequat vel, vehicula tortor quis pede turpis cursus quis, egestas ipsum ultricies ut, eleifend velit. Mauris vestibulum iaculis. Sed in nunc. Vivamus elit porttitor egestas. Mauris purus :?:',
						'<strong>Welcome to the jungle!</strong> We got fun n games! :) We got everything you want 8-) <em>Honey we know the names :)</em>',
						"<strong;)>a little bit of this\na little bit:other: of that :D\n:D a little bit of good\nyeah with a little bit of bad8O",
						'<strong style="here comes the sun :-D">and I say it\'s allright:D:D',
						'<!-- Woo-hoo, I\'m a comment, baby! :x > -->',
						':?:P:?::-x:mrgreen:::', /*
						'the question is, <textarea>Should smilies be converted in textareas :?:</textarea>',
						'the question is, <code>Should smilies be converted in code or pre tags :?:</code>',
						'the question is, <code style="color:#fff">Should smilies be converted in code or pre tags :?:</code>',
						'the question is, <code>Should smilies be converted in invalid code or pre tags :?:</pre>',
						'<Am I greedy?>Yes I am :)> :) The world makes me :mad:' */
						);

		$outputs = array(
						'Lorem ipsum dolor sit amet mauris <img src=\''.$includes_path.'icon_wink.gif\' alt=\';-)\' class=\'wp-smiley\' />  Praesent gravida sodales. <img src=\''.$includes_path.'icon_lol.gif\' alt=\':lol:\' class=\'wp-smiley\' />  Vivamus nec diam in faucibus eu, bibendum varius nec, imperdiet purus est, at augue at lacus malesuada elit dapibus a, <img src=\''.$includes_path.'icon_surprised.gif\' alt=\':eek:\' class=\'wp-smiley\' />  mauris. Cras mauris viverra elit. Nam laoreet viverra. Pellentesque tortor. Nam libero ante, porta urna ut turpis. Nullam wisi magna, <img src=\''.$includes_path.'icon_mrgreen.gif\' alt=\':mrgreen:\' class=\'wp-smiley\' />  tincidunt nec, sagittis non, fringilla enim. Nam consectetuer nec, ullamcorper pede eu dui odio consequat vel, vehicula tortor quis pede turpis cursus quis, egestas ipsum ultricies ut, eleifend velit. Mauris vestibulum iaculis. Sed in nunc. Vivamus elit porttitor egestas. Mauris purus <img src=\''.$includes_path.'icon_question.gif\' alt=\':?:\' class=\'wp-smiley\' /> ',
						'<strong>Welcome to the jungle!</strong> We got fun n games! <img src=\''.$includes_path.'icon_smile.gif\' alt=\':)\' class=\'wp-smiley\' />  We got everything you want <img src=\''.$includes_path.'icon_cool.gif\' alt=\'8-)\' class=\'wp-smiley\' /> <em>Honey we know the names <img src=\''.$includes_path.'icon_smile.gif\' alt=\':)\' class=\'wp-smiley\' /> </em>',
						"<strong;)>a little bit of this\na little bit:other: of that <img src='{$includes_path}icon_biggrin.gif' alt=':D' class='wp-smiley' />  <img src='{$includes_path}icon_biggrin.gif' alt=':D' class='wp-smiley' />  a little bit of good\nyeah with a little bit of bad8O",
						'<strong style="here comes the sun :-D">and I say it\'s allright:D:D',
						'<!-- Woo-hoo, I\'m a comment, baby! :x > -->',
						' <img src=\''.$includes_path.'icon_question.gif\' alt=\':?:\' class=\'wp-smiley\' /> P:?::-x:mrgreen:::', /*
						'the question is, <textarea>Should smilies be converted in textareas :?:</textarea>',
						'the question is, <code>Should smilies be converted in code or pre tags :?:</code>',
						'the question is, <code style="color:#fff">Should smilies be converted in code or pre tags :?:</code>',
						'the question is, <code>Should smilies be converted in invalid code or pre tags :?:</pre>',
						'<Am I greedy?>Yes I am <img src=\''.$includes_path.'icon_smile.gif\' alt=\':)\' class=\'wp-smiley\' /> > <img src=\''.$includes_path.'icon_smile.gif\' alt=\':)\' class=\'wp-smiley\' />  The world makes me <img src=\'http://wp-test.php/wp-includes/images/smilies/icon_mad.gif\' alt=\':mad:\' class=\'wp-smiley\' />' */
						);

		foreach ( $inputs as $k => $input ) {
			$this->assertEquals( $outputs[$k], convert_smilies($input) );
		}

		update_option( 'use_smilies', 0 );

		// standard smilies, use_smilies: OFF

		foreach ( $inputs as $input ) {
			$this->assertEquals( $input, convert_smilies($input) );
		}

		return;

		// custom smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );
		$wpsmiliestrans = array(
		  ':PP' => 'icon_tongue.gif',
		  ':arrow:' => 'icon_arrow.gif',
		  ':monkey:' => 'icon_shock_the_monkey.gif',
		  ':nervou:' => 'icon_nervou.gif'
		);

		smilies_init();

		$inputs = array('Peter Brian Gabriel (born 13 February 1950) is a British singer, musician, and songwriter who rose to fame as the lead vocalist and flautist of the progressive rock group Genesis. :monkey:',
						'Star Wars Jedi Knight:arrow: Jedi Academy is a first and third-person shooter action game set in the Star Wars universe. It was developed by Raven Software and published, distributed and marketed by LucasArts in North America and by Activision in the rest of the world. :nervou:',
						':arrow:monkey:Lorem ipsum dolor sit amet enim. Etiam ullam:PP<br />corper. Suspendisse a pellentesque dui, non felis.<a>:arrow::arrow</a>'
						);

		$outputs = array('Peter Brian Gabriel (born 13 February 1950) is a British singer, musician, and songwriter who rose to fame as the lead vocalist and flautist of the progressive rock group Genesis. <img src=\''.$includes_path.'icon_shock_the_monkey.gif\' alt=\'icon_arrow\' class=\'wp-smiley\' />',
						'Star Wars Jedi Knight<img src=\''.$includes_path.'icon_arrow.gif\' alt=\'icon_arrow\' class=\'wp-smiley\' /> Jedi Academy is a first and third-person shooter action game set in the Star Wars universe. It was developed by Raven Software and published, distributed and marketed by LucasArts in North America and by Activision in the rest of the world. <img src=\''.$includes_path.'icon_nervou.gif\' alt=\'icon_nervou\' class=\'wp-smiley\' />',
						'<img src=\''.$includes_path.'icon_arrow.gif\' alt=\'icon_arrow\' class=\'wp-smiley\' />monkey:Lorem ipsum dolor sit amet enim. Etiam ullam<img src=\''.$includes_path.'icon_tongue.gif\' alt=\'icon_tongue\' class=\'wp-smiley\' /><br />corper. Suspendisse a pellentesque dui, non felis.<a><img src=\''.$includes_path.'icon_arrow.gif\' alt=\'icon_arrow\' class=\'wp-smiley\' />:arrow</a>'
						);

		foreach ( $inputs as $k => $input ) {
			$this->assertEquals( $outputs[$k], convert_smilies($input) );
		}
	}
}
