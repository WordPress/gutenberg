import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const inputEventsListener: RichTextEventListener = ( props ) => ( element ) => {
	const { inputEvents } = props.current;
	function onInput( event: InputEvent ) {
		for ( const keyboardShortcut of inputEvents ) {
			keyboardShortcut( event );
		}
	}

	return subscribeOwnedListener( element, 'input', onInput );
};

export default inputEventsListener;
