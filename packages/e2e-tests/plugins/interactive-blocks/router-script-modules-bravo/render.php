<?php
/**
 * HTML for testing the iAPI's script module assets management.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

$modules = array( 'bravo-1', 'bravo-2' );

foreach ( $modules as $module ) {
	$module_path = '/module-' . $module . '.js';
	wp_register_script_module(
		'test/router-script-modules-' . $module,
		plugins_url( $module_path, __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . $module_path )
	);
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-testid'         => 'bravo-block',
		'data-wp-interactive' => 'test/router-script-modules-bravo',
	)
);
?>
<div <?php echo $wrapper_attributes; ?>>
	<span data-testid="text" data-wp-text="state.name"></span>
	<button data-testid="static" data-wp-on--click="actions.updateFromStatic">Static</button>
	<button data-testid="dynamic" data-wp-on--click="actions.updateFromDynamic">Dynamic</button>
	<button data-testid="initial-static" data-wp-on--click="actions.updateFromInitialStatic">Static (initial)</button>
	<button data-testid="initial-dynamic" data-wp-on--click="actions.updateFromInitialDynamic">Dynamic (initial)</button>
</div>
