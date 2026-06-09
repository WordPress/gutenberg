export default ( props ) => ( element ) => {
	const { inputEvents } = props.current;
	function onInput( event ) {
		for ( const inputEventHandler of inputEvents.current ) {
			inputEventHandler( event );
		}
	}

	element.addEventListener( 'input', onInput );
	return () => {
		element.removeEventListener( 'input', onInput );
	};
};
