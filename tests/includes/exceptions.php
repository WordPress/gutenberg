<?php

class WP_Tests_Exception extends PHPUnit_Framework_Exception {

}

/**
 * General exception for wp_die()
 */
class WPDieException extends Exception {}

/**
 * Exception for cases of wp_die(), for ajax tests.
 * This means there was an error (no output, and a call to wp_die)
 *
 * @package    WordPress
 * @subpackage Unit Tests
 * @since      3.4.0
 */
class WPAjaxDieStopException extends WPDieException {}

/**
 * Exception for cases of wp_die(), for ajax tests.
 * This means execution of the ajax function should be halted, but the unit
 * test can continue.  The function finished normally and there was not an
 * error (output happened, but wp_die was called to end execution)  This is
 * used with WP_Ajax_Response::send
 *
 * @package    WordPress
 * @subpackage Unit Tests
 * @since      3.4.0
 */
class WPAjaxDieContinueException extends WPDieException {}
