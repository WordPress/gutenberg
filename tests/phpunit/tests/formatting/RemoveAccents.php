<?php

/**
 * @group formatting
 */
class Tests_Formatting_RemoveAccents extends WP_UnitTestCase {
	public function test_remove_accents_simple() {
		$this->assertEquals( 'abcdefghijkl', remove_accents( 'abcdefghijkl' ) );
	}

	/**
	 * @ticket 9591
	 */
	public function test_remove_accents_latin1_supplement() {
		$input = 'ªºÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';
		$output = 'aoAAAAAAAECEEEEIIIIDNOOOOOOUUUUYTHsaaaaaaaeceeeeiiiidnoooooouuuuythy';

		$this->assertEquals( $output, remove_accents( $input ), 'remove_accents replaces Latin-1 Supplement' );
	}

	public function test_remove_accents_latin_extended_a() {
		$input = 'ĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſ';
		$output = 'AaAaAaCcCcCcCcDdDdEeEeEeEeEeGgGgGgGgHhHhIiIiIiIiIiIJijJjKkkLlLlLlLlLlNnNnNnNnNOoOoOoOEoeRrRrRrSsSsSsSsTtTtTtUuUuUuUuUuUuWwYyYZzZzZzs';

		$this->assertEquals( $output, remove_accents( $input ), 'remove_accents replaces Latin Extended A' );
	}

	public function test_remove_accents_latin_extended_b() {
		$this->assertEquals( 'SsTt', remove_accents( 'ȘșȚț' ), 'remove_accents replaces Latin Extended B' );
	}

	public function test_remove_accents_euro_pound_signs() {
		$this->assertEquals( 'E', remove_accents( '€' ), 'remove_accents replaces euro sign' );
		$this->assertEquals( '', remove_accents( '£' ), 'remove_accents replaces pound sign' );
	}

	public function test_remove_accents_iso8859() {
		// File is Latin1 encoded
		$file = DIR_TESTDATA . '/formatting/remove_accents.01.input.txt';
		$input = file_get_contents( $file );
		$input = trim( $input );
		$output = "EfSZszYcYuAAAAAACEEEEIIIINOOOOOOUUUUYaaaaaaceeeeiiiinoooooouuuuyyOEoeAEDHTHssaedhth";

		$this->assertEquals( $output, remove_accents( $input ), 'remove_accents from ISO-8859-1 text' );
	}

	/**
	 * @ticket 17738
	 */
	public function test_remove_accents_vowels_diacritic() {
		// Vowels with diacritic
		// unmarked
		$this->assertEquals( 'OoUu', remove_accents( 'ƠơƯư' ) );
		// grave accent
		$this->assertEquals( 'AaAaEeOoOoUuYy', remove_accents( 'ẦầẰằỀềỒồỜờỪừỲỳ' ) );
		// hook
		$this->assertEquals( 'AaAaAaEeEeIiOoOoOoUuUuYy', remove_accents( 'ẢảẨẩẲẳẺẻỂểỈỉỎỏỔổỞởỦủỬửỶỷ' ) );
		// tilde
		$this->assertEquals( 'AaAaEeEeOoOoUuYy', remove_accents( 'ẪẫẴẵẼẽỄễỖỗỠỡỮữỸỹ' ) );
		// acute accent
		$this->assertEquals( 'AaAaEeOoOoUu', remove_accents( 'ẤấẮắẾếỐốỚớỨứ' ) );
		// dot below
		$this->assertEquals( 'AaAaAaEeEeIiOoOoOoUuUuYy', remove_accents( 'ẠạẬậẶặẸẹỆệỊịỌọỘộỢợỤụỰựỴỵ' ) );
	}

	/**
	 * @ticket 20772
	 */
	public function test_remove_accents_hanyu_pinyin() {
		// Vowels with diacritic (Chinese, Hanyu Pinyin)
		// macron
		$this->assertEquals( 'aeiouuAEIOUU', remove_accents( 'āēīōūǖĀĒĪŌŪǕ' ) );
		// acute accent
		$this->assertEquals( 'aeiouuAEIOUU', remove_accents( 'áéíóúǘÁÉÍÓÚǗ' ) );
		// caron
		$this->assertEquals( 'aeiouuAEIOUU', remove_accents( 'ǎěǐǒǔǚǍĚǏǑǓǙ' ) );
		// grave accent
		$this->assertEquals( 'aeiouuAEIOUU', remove_accents( 'àèìòùǜÀÈÌÒÙǛ' ) );
		// unmarked
		$this->assertEquals( 'aaeiouuAEIOUU', remove_accents( 'aɑeiouüAEIOUÜ' ) );
	}

	function _remove_accents_germanic_umlauts_cb() {
		return 'de_DE';
	}

	/**
	 * @ticket 3782
	 */
	public function test_remove_accents_germanic_umlauts() {
		add_filter( 'locale', array( $this, '_remove_accents_germanic_umlauts_cb' ) );

		$this->assertEquals( 'AeOeUeaeoeuess', remove_accents( 'ÄÖÜäöüß' ) );

		remove_filter( 'locale', array( $this, '_remove_accents_germanic_umlauts_cb' ) );
	}

	public function _set_locale_to_danish() {
		return 'da_DK';
	}

	/**
	 * @ticket 23907
	 */
	public function test_remove_danish_accents() {
		add_filter( 'locale', array( $this, '_set_locale_to_danish' ) );
		
		$this->assertEquals( 'AeOeAaaeoeaa', remove_accents( 'ÆØÅæøå' ) );
		
		remove_filter( 'locale', array( $this, '_set_locale_to_danish' ) );
	}

}
