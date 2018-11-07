<?php

require_once '/default-parser.php';

class MyParser {
	function __construct() {
		$this->parser = new WP_Block_Parser();
	}

	public function parse( $document ) {
		return $this->parser->parse( $document );
	}
}
