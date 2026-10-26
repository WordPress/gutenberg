<?php
/**
 * Adds each wp-build PHP template to the paths that PHPStan analyzes.
 *
 * The templates are listed one by one rather than as their directory: PHPStan finds the functions
 * declared in an analyzed directory by reading the raw files, which it cannot do for a template, while
 * it finds those in an analyzed file by parsing it, which WpBuildTemplateParser makes possible. Since
 * the paths do not accept a glob, they are listed here, so that a new template is included as well.
 */

$templates = glob( dirname( __DIR__, 2 ) . '/packages/wp-build/templates/*.php.template' );

return array(
	'parameters' => array(
		'paths' => false === $templates ? array() : $templates,
	),
);
