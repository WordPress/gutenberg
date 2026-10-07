import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';
import { tip } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';

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

function Tips() {
	const [ randomIndex ] = useState( () =>
		Math.floor( Math.random() * globalTips.length )
	);

	return (
		<Notice.Root intent="info" icon={ tip }>
			<Notice.Description>
				{ globalTips[ randomIndex ] }
			</Notice.Description>
		</Notice.Root>
	);
}

export default Tips;
