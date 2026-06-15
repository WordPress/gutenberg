/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

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

	return subscribeDelegatedListener( element, 'beforeinput', onInput );
};
