/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Cell from '../mobile/bottom-sheet/cell';

function TextControl( {
	label,
	hideLabelFromVision,
	value,
	help,
	className,
	instanceId,
	onChange,
	type = 'text',
	placeholder,
	...props
} ) {
	const id = `inspector-text-control-${ instanceId }`;

	return (
		<Cell
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
			type={ type }
			value={ value }
			onChangeValue={ onChange }
			aria-describedby={ !! help ? id + '__help' : undefined }
			valuePlaceholder={ placeholder }
			{ ...props }
		/>
	);
}

export default memo( TextControl );
