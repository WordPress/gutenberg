export default ( props ) => ( element ) => {
	const { inputEvents } = props.current;
	function onInput( event ) {
		for ( const keyboardShortcut of inputEvents.current ) {
			keyboardShortcut( event );
		}
	}

	element.addEventListener( 'input', onInput );
	return () => {
		element.removeEventListener( 'input', onInput );
	};
};
