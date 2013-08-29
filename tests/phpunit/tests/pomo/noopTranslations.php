<?php

class Tests_POMO_NOOPTranslations extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->noop = new NOOP_Translations;
		$this->entry = new Translation_Entry( array( 'singular' => 'baba' ) );
		$this->plural_entry = new Translation_Entry(array('singular' => 'dyado', 'plural' => 'dyados', 'translations' => array('dyadox', 'dyadoy')));
	}

	function test_get_header() {
		$this->assertEquals( false, $this->noop->get_header( 'Content-Type' ) );
	}

	function test_add_entry() {
		$this->noop->add_entry( $this->entry );
		$this->assertEquals( array(), $this->noop->entries );
	}

	function test_set_header() {
		$this->noop->set_header( 'header', 'value' );
		$this->assertEquals( array(), $this->noop->headers );
	}

	function test_translate_entry() {
		$this->noop->add_entry( $this->entry );
		$this->assertEquals( false, $this->noop->translate_entry( $this->entry ) );
	}

	function test_translate() {
		$this->noop->add_entry( $this->entry );
		$this->assertEquals( 'baba', $this->noop->translate( 'baba' ) );
	}

	function test_plural() {
		$this->noop->add_entry( $this->plural_entry );
		$this->assertEquals( 'dyado', $this->noop->translate_plural( 'dyado', 'dyados', 1 ) );
		$this->assertEquals( 'dyados', $this->noop->translate_plural( 'dyado', 'dyados', 11 ) );
		$this->assertEquals( 'dyados', $this->noop->translate_plural( 'dyado', 'dyados', 0 ) );
	}
}
