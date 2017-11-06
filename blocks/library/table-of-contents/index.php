<?php
/**
 * Table of Contents block.
 *
 * @package gutenberg
 */

// Load the Table of Contents class.
require_once dirname( __FILE__ ) . '/class-block-table-of-contents.php';
add_action( 'init', array( 'Block_Table_Of_Contents', 'init' ) );
