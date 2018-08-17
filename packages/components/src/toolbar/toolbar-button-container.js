export default ( props ) => (
	<div
		key={ props.keykeyProp }
		className={ props.className }
	>
		{ props.children }
	</div>
);
