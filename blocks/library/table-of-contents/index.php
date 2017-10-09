<?php
/**
 * Table of Contents block.
 *
 * @package gutenberg
 */

// Load the Table of Contents class.
require_once './class-block-table-of-contents.php';
add_action( 'init', array( 'Gutenberg_Table_Of_Contents', 'init' ) );
