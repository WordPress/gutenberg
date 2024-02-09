<?php
/**
 * WP_Style_Engine_CSS_Rules_Container
 *
 * A container for WP_Style_Engine_CSS_Rule objects.
 *
 * @package Gutenberg
 */
// @TODO new file and tests
// Should have same/similar interface to WP_Style_Engine_CSS_Rule or maybe even part of it?
class WP_Style_Engine_CSS_Rules_Container {
	protected $container;
	protected $rules = array();

	public function __construct( $container = '', $rule ) {
		$this->set_container( $container );
		// @TODO should be able to add multiple rules.
		// @TODO check for instance of WP_Style_Engine_CSS_Rule
		$this->add_rule( $rule );
	}

	public function set_container( $container ) {
		$this->container = $container;
		return $this;
	}

	public function get_container() {
		return $this->container;
	}

	public function get_rules() {
		return $this->rules;
	}

	public function get_rule( $selector ) {
		return $this->rules[ $selector ] ?? null;
	}

	public function add_rule( $rule ) {
		// @TODO should be able to add multiple rules.
		// @TODO should be able to return a rule and update its selectors
		// @TODO check for instance of WP_Style_Engine_CSS_Rule
		$selector = $rule->get_selector();

		if ( isset( $this->rules[ $selector ] ) ) {
			$this->rules[ $selector ]->add_declarations( $rule->get_declarations() );
		} else {
			$this->rules[ $selector ] = $rule;
		}
		return $this;
	}

	public function get_css( $should_prettify = false, $indent_count = 0 ) {
		$css                 = '';
		$indent_count         = $should_prettify ? $indent_count + 1 : $indent_count;
		$new_line            = $should_prettify ? "\n" : '';
		$spacer              = $should_prettify ? ' ' : '';
		foreach ( $this->rules as $rule ) {
			$css .= $rule->get_css( $should_prettify, $indent_count );
			$css .= $should_prettify ? "\n" : '';
		}

		if ( empty( $css ) ) {
			return '';
		}

		return "{$this->container}{$spacer}{{$new_line}{$css}}";
	}
}
