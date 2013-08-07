<?php

class Tests_POMO_TranslationEntry extends WP_UnitTestCase {

	function test_create_entry() {
		// no singular => empty object
		$entry = new Translation_Entry();
		$this->assertNull($entry->singular);
		$this->assertNull($entry->plural);
		$this->assertFalse($entry->is_plural);
		// args -> members
		$entry = new Translation_Entry(array(
			'singular' => 'baba',
			'plural' => 'babas',
			'translations' => array('баба', 'баби'),
			'references' => 'should be array here',
			'flags' => 'baba',
		));
		$this->assertEquals('baba', $entry->singular);
		$this->assertEquals('babas', $entry->plural);
		$this->assertTrue($entry->is_plural);
		$this->assertEquals(array('баба', 'баби'), $entry->translations);
		$this->assertEquals(array(), $entry->references);
		$this->assertEquals(array(), $entry->flags);
	}

	function test_key() {
		$entry_baba = new Translation_Entry(array('singular' => 'baba',));
		$entry_dyado = new Translation_Entry(array('singular' => 'dyado',));
		$entry_baba_ctxt = new Translation_Entry(array('singular' => 'baba', 'context' => 'x'));
		$entry_baba_plural = new Translation_Entry(array('singular' => 'baba', 'plural' => 'babas'));
		$this->assertEquals($entry_baba->key(), $entry_baba_plural->key());
		$this->assertNotEquals($entry_baba->key(), $entry_baba_ctxt->key());
		$this->assertNotEquals($entry_baba_plural->key(), $entry_baba_ctxt->key());
		$this->assertNotEquals($entry_baba->key(), $entry_dyado->key());
	}
}
