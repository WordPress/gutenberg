const ToolbarGroupContainer = ( { className, children, ...props } ) => (
	<div className={ className } { ...props }>
		{ children }
	</div>
);
export default ToolbarGroupContainer;
