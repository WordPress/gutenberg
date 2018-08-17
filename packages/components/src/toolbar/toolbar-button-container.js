export default ( props ) => (
	<div
		key={ props.keyProp }
		className={ props.className }
	>
		{ props.children }
	</div>
);
