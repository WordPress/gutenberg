/**
 * External dependencies
 */
import classnames from 'classnames';

export default function Separator( props ) {
	const { customText, editable, onChange, onKeyDown, className } = props;
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
		<div className={ classnames( 'components-separator', className ) }>
			{ customText && label }
		</div>
	);
}
