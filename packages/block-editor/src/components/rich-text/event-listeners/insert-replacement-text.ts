import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

/**
 * When the browser is about to auto correct, add an undo level so the user can
 * revert the change.
 *
 * @param props
 */
const insertReplacementText: RichTextEventListener =
	( props ) => ( element ) => {
		function onInput( event: InputEvent ) {
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

export default insertReplacementText;
