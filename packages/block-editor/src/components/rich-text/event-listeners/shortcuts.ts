import type { RichTextField } from '../types';

export function onKeyDown( { props }: RichTextField, event: KeyboardEvent ) {
	for ( const keyboardShortcut of props.current.keyboardShortcuts ) {
		keyboardShortcut( event );
	}
}
