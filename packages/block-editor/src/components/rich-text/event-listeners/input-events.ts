import type { RichTextField } from '../types';

export function onInput( { props }: RichTextField, event: InputEvent ) {
	for ( const keyboardShortcut of props.current.inputEvents ) {
		keyboardShortcut( event );
	}
}
