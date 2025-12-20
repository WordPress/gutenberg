export default ( props ) => ( element ) => {
	const { keyboardShortcuts } = props.current;
	function onKeyDown( event ) {
		for ( const keyboardShortcut of keyboardShortcuts.current ) {
			keyboardShortcut( event );
		}
	}

	element.addEventListener( 'keydown', onKeyDown );
	return () => {
		element.removeEventListener( 'keydown', onKeyDown );
	};
};
