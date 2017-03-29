function Text( { html, onChange } ) {
	const changeValue = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<div className="editor-mode-text">
			<textarea value={ html } onChange={ changeValue } />
		</div>
	);
}

export default Text;
