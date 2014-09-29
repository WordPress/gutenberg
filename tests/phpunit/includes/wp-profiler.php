<?php

/*
A simple manually-instrumented profiler for WordPress.

This records basic execution time, and a summary of the actions and SQL queries run within each block.

start() and stop() must be called in pairs, for example:

function something_to_profile() {
	wppf_start(__FUNCTION__);
	do_stuff();
	wppf_stop();
}

Multiple profile blocks are permitted, and they may be nested.

*/

class WPProfiler {
	var $stack;
	var $profile;

	// constructor
	function WPProfiler() {
		$this->stack = array();
		$this->profile = array();
	}

	function start($name) {
		$time = $this->microtime();

		if (!$this->stack) {
			// log all actions and filters
			add_filter('all', array($this, 'log_filter'));
		}

		// reset the wpdb queries log, storing it on the profile stack if necessary
		global $wpdb;
		if ($this->stack) {
			$this->stack[count($this->stack)-1]['queries'] = $wpdb->queries;
		}
		$wpdb->queries = array();

		global $wp_object_cache;

		$this->stack[] = array(
			'start' => $time,
			'name' => $name,
			'cache_cold_hits' => $wp_object_cache->cold_cache_hits,
			'cache_warm_hits' => $wp_object_cache->warm_cache_hits,
			'cache_misses' => $wp_object_cache->cache_misses,
			'cache_dirty_objects' => $this->_dirty_objects_count($wp_object_cache->dirty_objects),
			'actions' => array(),
			'filters' => array(),
			'queries' => array(),
		);

	}

	function stop() {
		$item = array_pop($this->stack);
		$time = $this->microtime($item['start']);
		$name = $item['name'];

		global $wpdb;
		$item['queries'] = $wpdb->queries;
		global $wp_object_cache;

		$cache_dirty_count = $this->_dirty_objects_count($wp_object_cache->dirty_objects);
		$cache_dirty_delta = $this->array_sub($cache_dirty_count, $item['cache_dirty_objects']);

		if (isset($this->profile[$name])) {
			$this->profile[$name]['time'] += $time;
			$this->profile[$name]['calls'] ++;
			$this->profile[$name]['cache_cold_hits'] += ($wp_object_cache->cold_cache_hits - $item['cache_cold_hits']);
			$this->profile[$name]['cache_warm_hits'] += ($wp_object_cache->warm_cache_hits - $item['cache_warm_hits']);
			$this->profile[$name]['cache_misses'] += ($wp_object_cache->cache_misses - $item['cache_misses']);
			$this->profile[$name]['cache_dirty_objects'] = array_add( $this->profile[$name]['cache_dirty_objects'], $cache_dirty_delta) ;
			$this->profile[$name]['actions'] = array_add( $this->profile[$name]['actions'], $item['actions'] );
			$this->profile[$name]['filters'] = array_add( $this->profile[$name]['filters'], $item['filters'] );
			$this->profile[$name]['queries'] = array_add( $this->profile[$name]['queries'], $item['queries'] );
			#$this->_query_summary($item['queries'], $this->profile[$name]['queries']);

		}
		else {
			$queries = array();
			$this->_query_summary($item['queries'], $queries);
			$this->profile[$name] = array(
				'time' => $time,
				'calls' => 1,
				'cache_cold_hits' => ($wp_object_cache->cold_cache_hits - $item['cache_cold_hits']),
				'cache_warm_hits' => ($wp_object_cache->warm_cache_hits - $item['cache_warm_hits']),
				'cache_misses' => ($wp_object_cache->cache_misses - $item['cache_misses']),
				'cache_dirty_objects' => $cache_dirty_delta,
				'actions' => $item['actions'],
				'filters' => $item['filters'],
#				'queries' => $item['queries'],
				'queries' => $queries,
			);
		}

		if (!$this->stack) {
			remove_filter('all', array($this, 'log_filter'));
		}
	}

	function microtime($since = 0.0) {
		list($usec, $sec) = explode(' ', microtime());
		return (float)$sec + (float)$usec - $since;
	}

	function log_filter($tag) {
		if ($this->stack) {
			global $wp_actions;
			if ($tag == end($wp_actions))
				@$this->stack[count($this->stack)-1]['actions'][$tag] ++;
			else
				@$this->stack[count($this->stack)-1]['filters'][$tag] ++;
		}
		return $arg;
	}

	function log_action($tag) {
		if ($this->stack)
			@$this->stack[count($this->stack)-1]['actions'][$tag] ++;
	}

	function _current_action() {
		global $wp_actions;
		return $wp_actions[count($wp_actions)-1];
	}

	function results() {
		return $this->profile;
	}

	function _query_summary($queries, &$out) {
		foreach ($queries as $q) {
			$sql = $q[0];
			$sql = preg_replace('/(WHERE \w+ =) \d+/', '$1 x', $sql);
			$sql = preg_replace('/(WHERE \w+ =) \'\[-\w]+\'/', '$1 \'xxx\'', $sql);

			@$out[$sql] ++;
		}
		asort($out);
		return;
	}

	function _query_count($queries) {
		// this requires the savequeries patch at https://core.trac.wordpress.org/ticket/5218
		$out = array();
		foreach ($queries as $q) {
			if (empty($q[2]))
				@$out['unknown'] ++;
			else
				@$out[$q[2]] ++;
		}
		return $out;
	}

	function _dirty_objects_count($dirty_objects) {
		$out = array();
		foreach (array_keys($dirty_objects) as $group)
			$out[$group] = count($dirty_objects[$group]);
		return $out;
	}

	function array_add($a, $b) {
		$out = $a;
		foreach (array_keys($b) as $key)
			if (array_key_exists($key, $out))
				$out[$key] += $b[$key];
			else
				$out[$key] = $b[$key];
		return $out;
	}

	function array_sub($a, $b) {
		$out = $a;
		foreach (array_keys($b) as $key)
			if (array_key_exists($key, $b))
				$out[$key] -= $b[$key];
		return $out;
	}

	function print_summary() {
		$results = $this->results();

		printf("\nname                      calls   time action filter   warm   cold misses  dirty\n");
		foreach ($results as $name=>$stats) {
			printf("%24.24s %6d %6.4f %6d %6d %6d %6d %6d %6d\n", $name, $stats['calls'], $stats['time'], array_sum($stats['actions']), array_sum($stats['filters']), $stats['cache_warm_hits'], $stats['cache_cold_hits'], $stats['cache_misses'], array_sum($stats['cache_dirty_objects']));
		}
	}
}

global $wppf;
$wppf = new WPProfiler();

function wppf_start($name) {
	$GLOBALS['wppf']->start($name);
}

function wppf_stop() {
	$GLOBALS['wppf']->stop();
}

function wppf_results() {
	return $GLOBALS['wppf']->results();
}

function wppf_print_summary() {
	$GLOBALS['wppf']->print_summary();
}

?>