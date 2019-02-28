
export default function Separator( props ) {
	const { customText } = props;

	return (
		<div className="components-separator">
			{ customText && ( <span>{ customText }</span> ) }
		</div>
	);
}
