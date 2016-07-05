<?php

/**
 * @group functions.php
 * @group i18n
 */
class Tests_Functions_MaybeDeclineDate extends WP_UnitTestCase {

	/**
	 * @var string
	 */
	private $locale_original;

	/**
	 * @var WP_Locale
	 */
	private $wp_locale_original;

	public function setUp() {
		global $locale, $wp_locale;

		parent::setUp();

		$this->locale_original    = $locale;
		$this->wp_locale_original = clone $wp_locale;
	}

	public function tearDown() {
		global $locale, $wp_locale;

		$locale    = $this->locale_original;
		$wp_locale = $this->wp_locale_original;

		parent::tearDown();
	}

	/**
	 * @ticket 36790
	 * @dataProvider data_wp_maybe_decline_date
	 */
	public function test_wp_maybe_decline_date( $test_locale, $input, $output ) {
		global $locale, $wp_locale;

		add_filter( 'gettext_with_context', array( $this, 'filter__enable_months_names_declension' ), 10, 3 );

		$month_names = $this->get_months_names( $test_locale );

		$locale                    = $test_locale;
		$wp_locale->month          = $month_names['month'];
		$wp_locale->month_genitive = $month_names['month_genitive'];

		$declined_date = wp_maybe_decline_date( $input );

		remove_filter( 'gettext_with_context', array( $this, 'filter__enable_months_names_declension' ), 10 );

		$this->assertEquals( $output, $declined_date );
	}

	public function filter__enable_months_names_declension( $translation, $text, $context ) {
		if ( 'decline months names: on or off' === $context ) {
			$translation = 'on';
		}

		return $translation;
	}

	public function data_wp_maybe_decline_date() {
		return array(
			array( 'ru_RU', '21 Июнь',       '21 июня' ),
			array( 'ru_RU', '1 Январь 2016', '1 января 2016' ),
			array( 'pl_PL', '1 Styczeń',     '1 stycznia' ),
			array( 'hr',    '1. Siječanj',   '1. siječnja' ),
			array( 'ca',    '1 de abril',    "1 d'abril" ),
			array( 'cs_CZ', '1. Červen',     '1. června' ),
			array( 'cs_CZ', '1. Červenec',   '1. července' ),
		);
	}

	private function get_months_names( $locale ) {
		switch ( $locale ) {
			case 'ru_RU':
				$months = array(
					'month' => array( 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь' ),
					'month_genitive' => array( 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря' ),
				);
				break;

			case 'pl_PL':
				$months = array(
					'month' => array( 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień' ),
					'month_genitive' => array( 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia' ),
				);
				break;

			case 'hr':
				$months = array(
					'month' => array( 'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac' ),
					'month_genitive' => array( 'siječnja', 'veljače', 'ožujka', 'ožujka', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca' ),
				);
				break;

			case 'ca':
				$months = array(
					'month' => array( 'gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre' ),
					'month_genitive' => array( 'gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre' ),
				);
				break;

			case 'cs_CZ':
				$months = array(
					'month' => array( 'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec' ),
					'month_genitive' => array( 'ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince' ),
				);
				break;

			default:
				$months = array(
					'month' => array( 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ),
					'month_genitive' => array( 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ),
				);
		}

		return $months;
	}
}
