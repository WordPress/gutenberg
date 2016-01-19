<?php

class WP_UnitTest_Generator_Sequence {
	static $incr = -1;
	public $next;
	public $template_string;

	function __construct( $template_string = '%s', $start = null ) {
		if ( $start ) {
			$this->next = $start;
		} else {
			self::$incr++;
			$this->next = self::$incr;
		}
		$this->template_string = $template_string;
	}

	function next() {
		$generated = sprintf( $this->template_string , $this->next );
		$this->next++;
		return $generated;
	}
}
