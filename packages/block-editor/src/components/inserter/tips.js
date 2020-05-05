/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';
import { Tip } from '@wordpress/components';
import {context} from "@actions/github/lib/github";

const globalTips = [
	createInterpolateElement(
		__(
			'While writing, you can press <kbd>/</kbd> to quickly insert new blocks.'
		),
		{ kbd: <kbd /> }
	),
	createInterpolateElement(
		__(
			'Indent a list by pressing <kbd>space</kbd> at the beginning of a line.'
		),
		{ kbd: <kbd /> }
	),
	createInterpolateElement(
		__(
			'Outdent a list by pressing <kbd>backspace</kbd> at the beginning of a line.'
		),
		{ kbd: <kbd /> }
	),
	__( 'Drag files into the editor to automatically insert media blocks.' ),
	__( "Change a block's type by pressing the block icon on the toolbar." ),
];

const contextualTips = {
	css: createInterpolateElement(
		__(
			'CSS - You can visit the <a>the Customizer</a> to edit the CSS on your site.'
		),
		{
			a: <a href="/customize.php?autofocus[section]=custom_css" target="_blank"/>
		}
	),

	theme: createInterpolateElement(
		__(
			'theme - You can visit the <a>theme directory</a> to select a different design for your site.'
		),
		{
			a: <a href="/themes.php" target="_blank"/>
		}
	),

	plugin: createInterpolateElement(
		__(
			'plugin - You can visit the <a>plugin directory</a> to install additional plugins.'
		),
		{
			a: <a href="/plugin-install.php" target="_blank"/>
		}
	),

	header: createInterpolateElement(
		__(
			'header - You can visit the <a>the Customizer</a> to edit your logo and site title.'
		),
		{
			a: <a href="/customize.php?autofocus[section]=title_tagline" target="_blank"/>
		}
	),

	colors: createInterpolateElement(
		__(
			'colors - You can visit the <a>the Customizer</a> to edit your logo and site title.'
		),
		{
			a: <a href="/customize.php?autofocus[section]=colors" target="_blank"/>
		}
	),
};

function Tips( { tipContext } ) {
	if ( contextualTips[ tipContext ] ) {
		return <Tip>{ contextualTips[ tipContext ] }</Tip>;
	}

	const [ randomIndex ] = useState(
		// Disable Reason: I'm not generating an HTML id.
		// eslint-disable-next-line no-restricted-syntax
		Math.floor( Math.random() * globalTips.length )
	);

	return <Tip>{ globalTips[ randomIndex ] }</Tip>;
}

export default Tips;
