function PanelHeader( { label, children } ) {
	return (
		<div className="components-panel__header">
			{ label && <strong>{ label }</strong> }
			{ children }
		</div>
	);
}

export default PanelHeader;
