function Text( { html, onChange } ) {
	return (
		<div className="editor-mode-text">
			<textarea value={ html } onChange={ onChange } />
		</div>
	);
}

export default Text;
