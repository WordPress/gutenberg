<?php

class Tests_POMO_MO extends WP_UnitTestCase {

	function test_mo_simple() {
		$mo = new MO();
		$mo->import_from_file(DIR_TESTDATA . '/pomo/simple.mo');
		$this->assertEquals(array('Project-Id-Version' => 'WordPress 2.6-bleeding', 'Report-Msgid-Bugs-To' => 'wp-polyglots@lists.automattic.com'), $mo->headers);
		$this->assertEquals(2, count($mo->entries));
		$this->assertEquals(array('dyado'), $mo->entries['baba']->translations);
		$this->assertEquals(array('yes'), $mo->entries["kuku\nruku"]->translations);
	}

	function test_mo_plural() {
		$mo = new MO();
		$mo->import_from_file(DIR_TESTDATA . '/pomo/plural.mo');
		$this->assertEquals(1, count($mo->entries));
		$this->assertEquals(array("oney dragoney", "twoey dragoney", "manyey dragoney", "manyeyey dragoney", "manyeyeyey dragoney"), $mo->entries["one dragon"]->translations);

		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', 1));
		$this->assertEquals('twoey dragoney', $mo->translate_plural('one dragon', '%d dragons', 2));
		$this->assertEquals('twoey dragoney', $mo->translate_plural('one dragon', '%d dragons', -8));


		$mo->set_header('Plural-Forms', 'nplurals=5; plural=0');
		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', 1));
		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', 2));
		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', -8));

		$mo->set_header('Plural-Forms', 'nplurals=5; plural=n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;');
		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', 1));
		$this->assertEquals('manyey dragoney', $mo->translate_plural('one dragon', '%d dragons', 11));
		$this->assertEquals('twoey dragoney', $mo->translate_plural('one dragon', '%d dragons', 3));

		$mo->set_header('Plural-Forms', 'nplurals=2; plural=n !=1;');
		$this->assertEquals('oney dragoney', $mo->translate_plural('one dragon', '%d dragons', 1));
		$this->assertEquals('twoey dragoney', $mo->translate_plural('one dragon', '%d dragons', 2));
		$this->assertEquals('twoey dragoney', $mo->translate_plural('one dragon', '%d dragons', -8));
	}

	function test_mo_context() {
		$mo = new MO();
		$mo->import_from_file(DIR_TESTDATA . '/pomo/context.mo');
		$this->assertEquals(2, count($mo->entries));
		$plural_entry = new Translation_Entry(array('singular' => 'one dragon', 'plural' => '%d dragons', 'translations' => array("oney dragoney", "twoey dragoney","manyey dragoney"), 'context' => 'dragonland'));
		$this->assertEquals($plural_entry, $mo->entries[$plural_entry->key()]);
		$this->assertEquals("dragonland", $mo->entries[$plural_entry->key()]->context);

		$single_entry = new Translation_Entry(array('singular' => 'one dragon', 'translations' => array("oney dragoney"), 'context' => 'not so dragon'));
		$this->assertEquals($single_entry, $mo->entries[$single_entry->key()]);
		$this->assertEquals("not so dragon", $mo->entries[$single_entry->key()]->context);

	}

	function test_translations_merge() {
		$host = new Translations();
		$host->add_entry(new Translation_Entry(array('singular' => 'pink',)));
		$host->add_entry(new Translation_Entry(array('singular' => 'green',)));
		$guest = new Translations();
		$guest->add_entry(new Translation_Entry(array('singular' => 'green',)));
		$guest->add_entry(new Translation_Entry(array('singular' => 'red',)));
		$host->merge_with($guest);
		$this->assertEquals(3, count($host->entries));
		$this->assertEquals(array(), array_diff(array('pink', 'green', 'red'), array_keys($host->entries)));
	}

	function test_export_mo_file() {
		$entries = array();
		$entries[] = new Translation_Entry(array('singular' => 'pink',
			'translations' => array('розов')));
		$no_translation_entry = new Translation_Entry(array('singular' => 'grey'));
		$entries[] = new Translation_Entry(array('singular' => 'green', 'plural' => 'greens',
			'translations' => array('зелен', 'зелени')));
		$entries[] = new Translation_Entry(array('singular' => 'red', 'context' => 'color',
			'translations' => array('червен')));
		$entries[] = new Translation_Entry(array('singular' => 'red', 'context' => 'bull',
			'translations' => array('бик')));
		$entries[] = new Translation_Entry(array('singular' => 'maroon', 'plural' => 'maroons', 'context' => 'context',
			'translations' => array('пурпурен', 'пурпурни')));

		$mo = new MO();
		$mo->set_header('Project-Id-Version', 'Baba Project 1.0');
		foreach($entries as $entry) {
			$mo->add_entry($entry);
		}
		$mo->add_entry($no_translation_entry);

		$temp_fn = $this->temp_filename();
		$mo->export_to_file($temp_fn);

		$again = new MO();
		$again->import_from_file($temp_fn);

		$this->assertEquals(count($entries), count($again->entries));
		foreach($entries as $entry) {
			$this->assertEquals($entry, $again->entries[$entry->key()]);
		}
	}

	function test_export_should_not_include_empty_translations() {
		$entries = array(  );
		$mo = new MO;
		$mo->add_entry( array( 'singular' => 'baba', 'translations' => array( '', '' ) ) );

		$temp_fn = $this->temp_filename();
		$mo->export_to_file( $temp_fn );

		$again = new MO();
		$again->import_from_file($temp_fn);

		$this->assertEquals( 0, count( $again->entries ) );
	}

	function test_nplurals_with_backslashn() {
		$mo = new MO();
		$mo->import_from_file(DIR_TESTDATA . '/pomo/bad_nplurals.mo');
		$this->assertEquals('%d foro', $mo->translate_plural('%d forum', '%d forums', 1));
		$this->assertEquals('%d foros', $mo->translate_plural('%d forum', '%d forums', 2));
		$this->assertEquals('%d foros', $mo->translate_plural('%d forum', '%d forums', -1));
	}

	function disabled_test_performance() {
		$start = microtime(true);
		$mo = new MO();
		$mo->import_from_file(DIR_TESTDATA . '/pomo/de_DE-2.8.mo');
		// echo "\nPerformance: ".(microtime(true) - $start)."\n";
	}

	function test_overloaded_mb_functions() {
		// skipIf() method skips the whole test case, not only this method
		// that's why we are skipping it the stupid way
		if ((ini_get("mbstring.func_overload") & 2) != 0) {
			$mo = new MO();
			$mo->import_from_file(DIR_TESTDATA . '/pomo/overload.mo');
			$this->assertEquals(array('Табло'), $mo->entries['Dashboard']->translations);
		}
	}

	function test_load_pot_file() {
		$mo = new MO();
		$this->assertEquals( false, $mo->import_from_file(DIR_TESTDATA . '/pomo/mo.pot') );
	}
}
