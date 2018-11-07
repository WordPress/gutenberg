<?php

require_once '/post.peg.php';

class MyParser {
    function __construct() {
        $this->parser = new Gutenberg_PEG_Parser();
    }

    public function parse( $document ) {
        return $this->parser->parse( $document );
    }
}
