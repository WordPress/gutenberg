
export default function Separator( props ) {
	const { customText, editable, onChange, onKeyDown } = props;
	const inputLength = customText.length + 1;

	const staticLabel = (
		<span className="components-separator__label">{ customText }</span>
	);
	const editableLabel = (
		<input
			className="components-separator__label"
			type="text"
			value={ customText }
			size={ inputLength }
			onChange={ onChange }
			onKeyDown={ onKeyDown }
		/>
	);
	const label = ( editable ? editableLabel : staticLabel );

	return (
		<div className="components-separator">
			{ customText && label }
		</div>
	);
}
