/**
 * WordPress dependencies
 */
import { BACKSPACE, ESCAPE } from '@wordpress/keycodes';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== BACKSPACE && keyCode !== ESCAPE ) {
			return;
		}

		const { registry } = props.current;
		const { didAutomaticChange, getSettings } =
			registry.select( blockEditorStore );

		const { __experimentalUndo } = getSettings();

		if ( ! __experimentalUndo ) {
			return;
		}

		if ( ! didAutomaticChange() ) {
			return;
		}

		event.preventDefault();
		__experimentalUndo();
	}

	return subscribeDelegatedListener( element, 'keydown', onKeyDown );
};
