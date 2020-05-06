/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

export default [
	[
		'css',
		[ 'css', __( 'css' ), 'style', __( 'style' ) ],
		createInterpolateElement(
			__(
				'CSS - You can visit the <a>the Customizer</a> to edit the CSS on your site.'
			),
			{
				a: <a href="/customize.php?autofocus[section]=custom_css" target="_blank"/>
			}
		),
	],

	[
		'theme',
		[ 'theme', __( 'theme' ) ],
		createInterpolateElement(
			__(
				'theme - You can visit the <a>theme directory</a> to select a different design for your site.'
			),
			{
				a: <a href="/themes.php" target="_blank"/>
			}
		),
	],

	[
		'plugin',
		[ 'plugin', __( 'plugin' ) ],
		createInterpolateElement(
			__(
				'plugin - You can visit the <a>plugin directory</a> to install additional plugins.'
			),
			{
				a: <a href="/plugin-install.php" target="_blank"/>
			}
		),
	],

	[
		'header',
		[ 'header', __( 'header' ) ],
		createInterpolateElement(
			__(
				'header - You can visit the <a>the Customizer</a> to edit your logo and site title.'
			),
			{
				a: <a href="/customize.php?autofocus[section]=title_tagline" target="_blank"/>
			}
		),
	],
	[
		'colors',
		[ 'colors', __( 'colors' ) ],
		createInterpolateElement(
			__(
				'colors - You can visit the <a>the Customizer</a> to edit the colors on your site.'
			),
			{
				a: <a href="/customize.php?autofocus[section]=colors" target="_blank"/>
			}
		),
	],
];
