<?php

// misc help functions and utilities

function rand_str($len=32) {
	return substr(md5(uniqid(rand())), 0, $len);
}

// strip leading and trailing whitespace from each line in the string
function strip_ws($txt) {
	$lines = explode("\n", $txt);
	$result = array();
	foreach ($lines as $line)
		if (trim($line))
			$result[] = trim($line);

	return trim(join("\n", $result));
}

// helper class for testing code that involves actions and filters
// typical use:
// $ma = new MockAction();
// add_action('foo', array(&$ma, 'action'));
class MockAction {
	var $events;
	var $debug;

	function MockAction($debug=0) {
		$this->reset();
		$this->debug = $debug;
	}

	function reset() {
		$this->events = array();
	}

	function current_filter() {
		if (is_callable('current_filter'))
			return current_filter();
		global $wp_actions;
		return end($wp_actions);
	}

	function action($arg) {
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());
		$args = func_get_args();
		$this->events[] = array('action' => __FUNCTION__, 'tag'=>$this->current_filter(), 'args'=>$args);
		return $arg;
	}

	function action2($arg) {
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());

		$args = func_get_args();
		$this->events[] = array('action' => __FUNCTION__, 'tag'=>$this->current_filter(), 'args'=>$args);
		return $arg;
	}

	function filter($arg) {
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());

		$args = func_get_args();
		$this->events[] = array('filter' => __FUNCTION__, 'tag'=>$this->current_filter(), 'args'=>$args);
		return $arg;
	}

	function filter2($arg) {
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());

		$args = func_get_args();
		$this->events[] = array('filter' => __FUNCTION__, 'tag'=>$this->current_filter(), 'args'=>$args);
		return $arg;
	}

	function filter_append($arg) {
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());

		$args = func_get_args();
		$this->events[] = array('filter' => __FUNCTION__, 'tag'=>$this->current_filter(), 'args'=>$args);
		return $arg . '_append';
	}

	function filterall($tag, $arg=NULL) {
	// this one doesn't return the result, so it's safe to use with the new 'all' filter
if ($this->debug) dmp(__FUNCTION__, $this->current_filter());

		$args = func_get_args();
		$this->events[] = array('filter' => __FUNCTION__, 'tag'=>$tag, 'args'=>array_slice($args, 1));
	}

	// return a list of all the actions, tags and args
	function get_events() {
		return $this->events;
	}

	// return a count of the number of times the action was called since the last reset
	function get_call_count($tag='') {
		if ($tag) {
			$count = 0;
			foreach ($this->events as $e)
				if ($e['action'] == $tag)
					++$count;
			return $count;
		}
		return count($this->events);
	}

	// return an array of the tags that triggered calls to this action
	function get_tags() {
		$out = array();
		foreach ($this->events as $e) {
			$out[] = $e['tag'];
		}
		return $out;
	}

	// return an array of args passed in calls to this action
	function get_args() {
		$out = array();
		foreach ($this->events as $e)
			$out[] = $e['args'];
		return $out;
	}
}

// convert valid xml to an array tree structure
// kinda lame but it works with a default php 4 install
class testXMLParser {
	var $xml;
	var $data = array();

	function testXMLParser($in) {
		$this->xml = xml_parser_create();
		xml_set_object($this->xml, $this);
		xml_parser_set_option($this->xml,XML_OPTION_CASE_FOLDING, 0);
		xml_set_element_handler($this->xml, array($this, 'startHandler'), array($this, 'endHandler'));
		xml_set_character_data_handler($this->xml, array($this, 'dataHandler'));
		$this->parse($in);
	}

	function parse($in) {
		$parse = xml_parse($this->xml, $in, sizeof($in));
		if (!$parse) {
			trigger_error(sprintf("XML error: %s at line %d",
			xml_error_string(xml_get_error_code($this->xml)),
			xml_get_current_line_number($this->xml)), E_USER_ERROR);
			xml_parser_free($this->xml);
		}
		return true;
	}

	function startHandler($parser, $name, $attributes) {
		$data['name'] = $name;
		if ($attributes) { $data['attributes'] = $attributes; }
		$this->data[] = $data;
	}

	function dataHandler($parser, $data) {
		$index = count($this->data) - 1;
		@$this->data[$index]['content'] .= $data;
	}

	function endHandler($parser, $name) {
		if (count($this->data) > 1) {
			$data = array_pop($this->data);
			$index = count($this->data) - 1;
			$this->data[$index]['child'][] = $data;
		}
	}
}

function xml_to_array($in) {
	$p = new testXMLParser($in);
	return $p->data;
}

function xml_find($tree /*, $el1, $el2, $el3, .. */) {
	$a = func_get_args();
	$a = array_slice($a, 1);
	$n = count($a);
	$out = array();

	if ($n < 1)
		return $out;

	for ($i=0; $i<count($tree); $i++) {
#		echo "checking '{$tree[$i][name]}' == '{$a[0]}'\n";
#		var_dump($tree[$i]['name'], $a[0]);
		if ($tree[$i]['name'] == $a[0]) {
#			echo "n == {$n}\n";
			if ($n == 1)
				$out[] = $tree[$i];
			else {
				$subtree =& $tree[$i]['child'];
				$call_args = array($subtree);
				$call_args = array_merge($call_args, array_slice($a, 1));
				$out = array_merge($out, call_user_func_array('xml_find', $call_args));
			}
		}
	}

	return $out;
}

function xml_join_atts($atts) {
	$a = array();
	foreach ($atts as $k=>$v)
		$a[] = $k.'="'.$v.'"';
	return join(' ', $a);
}

function xml_array_dumbdown(&$data) {
	$out = array();

	foreach (array_keys($data) as $i) {
		$name = $data[$i]['name'];
		if (!empty($data[$i]['attributes']))
			$name .= ' '.xml_join_atts($data[$i]['attributes']);

		if (!empty($data[$i]['child'])) {
			$out[$name][] = xml_array_dumbdown($data[$i]['child']);
		}
		else
			$out[$name] = $data[$i]['content'];
	}

	return $out;
}

function dmp() {
	$args = func_get_args();

	foreach ($args as $thing)
		echo (is_scalar($thing) ? strval($thing) : var_export($thing, true)), "\n";
}

function dmp_filter($a) {
	dmp($a);
	return $a;
}

function get_echo($callable, $args = array()) {
	ob_start();
	call_user_func_array($callable, $args);
	return ob_get_clean();
}

// recursively generate some quick assertEquals tests based on an array
function gen_tests_array($name, $array) {
	$out = array();
	foreach ($array as $k=>$v) {
		if (is_numeric($k))
			$index = strval($k);
		else
			$index = "'".addcslashes($k, "\n\r\t'\\")."'";

		if (is_string($v)) {
			$out[] = '$this->assertEquals( \'' . addcslashes($v, "\n\r\t'\\") . '\', $'.$name.'['.$index.'] );';
		}
		elseif (is_numeric($v)) {
			$out[] = '$this->assertEquals( ' . $v . ', $'.$name.'['.$index.'] );';
		}
		elseif (is_array($v)) {
			$out[] = gen_tests_array("{$name}[{$index}]", $v);
		}
	}
	return join("\n", $out)."\n";
}

/**
 * Use to create objects by yourself
 */
class MockClass {};

/**
 * Drops all tables from the WordPress database
 */
function drop_tables() {
	global $wpdb;
	$tables = $wpdb->get_col('SHOW TABLES;');
	foreach ($tables as $table)
		$wpdb->query("DROP TABLE IF EXISTS {$table}");
}

function print_backtrace() {
	$bt = debug_backtrace();
	echo "Backtrace:\n";
	$i = 0;
	foreach ($bt as $stack) {
		echo ++$i, ": ";
		if ( isset($stack['class']) )
			echo $stack['class'].'::';
		if ( isset($stack['function']) )
			echo $stack['function'].'() ';
		echo "line {$stack[line]} in {$stack[file]}\n";
	}
	echo "\n";
}

// mask out any input fields matching the given name
function mask_input_value($in, $name='_wpnonce') {
	return preg_replace('@<input([^>]*) name="'.preg_quote($name).'"([^>]*) value="[^>]*" />@', '<input$1 name="'.preg_quote($name).'"$2 value="***" />', $in);
}

if ( !function_exists( 'str_getcsv' ) ) {
	function str_getcsv( $input, $delimiter = ',', $enclosure = '"', $escape = "\\" ) {
		$fp = fopen( 'php://temp/', 'r+' );
		fputs( $fp, $input );
		rewind( $fp );
		$data = fgetcsv( $fp, strlen( $input ), $delimiter, $enclosure );
		fclose( $fp );
		return $data;
	}
}

/**
 * Removes the post type and its taxonomy associations.
 */
function _unregister_post_type( $cpt_name ) {
	unset( $GLOBALS['wp_post_types'][ $cpt_name ] );
	unset( $GLOBALS['_wp_post_type_features'][ $cpt_name ] );

	foreach ( $GLOBALS['wp_taxonomies'] as $taxonomy ) {
		if ( false !== $key = array_search( $cpt_name, $taxonomy->object_type ) ) {
			unset( $taxonomy->object_type[$key] );
		}
	}
}

function _unregister_taxonomy( $taxonomy_name ) {
	unset( $GLOBALS['wp_taxonomies'][$taxonomy_name] );
}

/**
 * Unregister a post status.
 *
 * @since 4.2.0
 *
 * @param string $status
 */
function _unregister_post_status( $status ) {
	unset( $GLOBALS['wp_post_statuses'][ $status ] );
}

function _cleanup_query_vars() {
	// clean out globals to stop them polluting wp and wp_query
	foreach ( $GLOBALS['wp']->public_query_vars as $v )
		unset( $GLOBALS[$v] );

	foreach ( $GLOBALS['wp']->private_query_vars as $v )
		unset( $GLOBALS[$v] );

	foreach ( get_taxonomies( array() , 'objects' ) as $t ) {
		if ( ! empty( $t->query_var ) )
			$GLOBALS['wp']->add_query_var( $t->query_var );
	}

	foreach ( get_post_types( array() , 'objects' ) as $t ) {
		if ( ! empty( $t->query_var ) )
			$GLOBALS['wp']->add_query_var( $t->query_var );
	}
}

function _clean_term_filters() {
	remove_filter( 'get_terms',     array( 'Featured_Content', 'hide_featured_term'     ), 10, 2 );
	remove_filter( 'get_the_terms', array( 'Featured_Content', 'hide_the_featured_term' ), 10, 3 );
}

/**
 * Special class for exposing protected wpdb methods we need to access
 */
class wpdb_exposed_methods_for_testing extends wpdb {
	public function __construct() {
		global $wpdb;
		$this->dbh = $wpdb->dbh;
		$this->use_mysqli = $wpdb->use_mysqli;
		$this->ready = true;
		$this->field_types = $wpdb->field_types;
		$this->charset = $wpdb->charset;
	}

	public function __call( $name, $arguments ) {
		return call_user_func_array( array( $this, $name ), $arguments );
	}
}
