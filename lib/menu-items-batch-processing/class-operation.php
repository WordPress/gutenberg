<?php

namespace WP_REST_Menu_Items_Batch_Operation;

use \WP_Error;
use \WP_REST_Menu_Items_Controller;

abstract class Operation {
	const INSERT = 'insert';
	const UPDATE = 'update';
	const DELETE = 'delete';

	protected $controller;
	public $input;
	/** @var Operation */
	public $parent;
	public $prepared_item;
	public $result;

	/**
	 * Operation constructor.
	 *
	 * I really dislike the dependency on $controller, but core code is quite interlocked. I don't think
	 * it's possible to get rid of that without fundamental refactoring of WP_REST_Posts_Controller
	 * which is outside of scope of this change.
	 *
	 * @param $input
	 * @param $parent
	 * @param $result
	 */
	public function __construct( WP_REST_Menu_Items_Controller $controller, $input, $parent = null ) {
		$this->controller = $controller;
		$this->input = $input;
		$this->parent = $parent;
	}

	public function validate() {
		$result = $this->doValidate();
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$this->prepared_item = $result;

		return $result;
	}

	abstract protected function doValidate();

	public function persist( $request ) {
		if ( ! empty( $this->parent ) && $this->prepared_item ) {
			$this->prepared_item['menu-item-parent-id'] = $this->parent->result->ID;
		}

		$this->result = $this->doPersist( $request );

		return $this->result;
	}

	abstract protected function doPersist( $request );

	abstract public function notify( $request );
}
