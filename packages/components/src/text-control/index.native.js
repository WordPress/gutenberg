/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */
import Cell from '../mobile/bottom-sheet/cell';

const TextControl = React.memo(
	( {
		label,
		hideLabelFromVision,
		value,
		help,
		className,
		instanceId,
		onChange,
		type = 'text',
		...props
	} ) => {
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
				{ ...props }
			/>
		);
	}
);

export default TextControl;
