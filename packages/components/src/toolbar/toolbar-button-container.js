const ToolbarButtonContainer = ( props ) => (
	<div
		key={ props.keyProp }
		className={ props.className }
	>
		{ props.children }
	</div>
);
export default ToolbarButtonContainer;
