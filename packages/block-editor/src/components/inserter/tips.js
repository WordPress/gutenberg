/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';
import { Tip } from '@wordpress/components';

const globalTips = [
	createInterpolateElement(
		__(
			// translators: Do not remove the <kbd> code.
			'While writing, you can press <kbd>/</kbd> to quickly insert new blocks.'
		),
		{ kbd: <kbd /> }
	),
	createInterpolateElement(
		__(
			// translators: Do not remove the <kbd> code.
			'Indent a list by pressing <kbd>space</kbd> at the beginning of a line.'
		),
		{ kbd: <kbd /> }
	),
	createInterpolateElement(
		__(
			// translators: Do not remove the <kbd> code.
			'Outdent a list by pressing <kbd>backspace</kbd> at the beginning of a line.'
		),
		{ kbd: <kbd /> }
	),
	__( 'Drag files into the editor to automatically insert media blocks.' ),
	__( "Change a block's type by pressing the block icon on the toolbar." ),
];

function Tips() {
	const [ randomIndex ] = useState(
		// Disable Reason: I'm not generating an HTML id.
		// eslint-disable-next-line no-restricted-syntax
		Math.floor( Math.random() * globalTips.length )
	);

	return <Tip>{ globalTips[ randomIndex ] }</Tip>;
}

export default Tips;
