/**
 * WordPress dependencies
 */

import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

/**
 * When the browser is about to auto correct, add an undo level so the user can
 * revert the change.
 *
 * @param {Object} props
 */
export default ( props ) => ( element ) => {
	function onInput( event ) {
		if ( event.inputType !== 'insertReplacementText' ) {
			return;
		}

		const { registry } = props.current;
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();
	}

	return subscribeOwnedListener( element, 'beforeinput', onInput );
};
