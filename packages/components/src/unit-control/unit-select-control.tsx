/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ChangeEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { UnitSelect, UnitLabel } from './styles/unit-control-styles';
import { CSS_UNITS, hasUnits } from './utils';
import type { UnitSelectControlProps } from './types';

function UnitSelectControl(
	{
		className,
		isUnitSelectTabbable: isTabbable = true,
		onChange,
		size = 'default',
		unit = 'px',
		units = CSS_UNITS,
		...props
	}: WordPressComponentProps< UnitSelectControlProps, 'select', false >,
	ref: ForwardedRef< any >
) {
	if ( ! hasUnits( units ) || units?.length === 1 ) {
		return (
			<UnitLabel
				className="components-unit-control__unit-label"
				selectSize={ size }
			>
				{ unit }
			</UnitLabel>
		);
	}

	const handleOnChange = ( event: ChangeEvent< HTMLSelectElement > ) => {
		const { value: unitValue } = event.target;
		const data = units.find( ( option ) => option.value === unitValue );

		onChange?.( unitValue, { event, data } );
	};

	const classes = clsx( 'components-unit-control__select', className );

	return (
		<UnitSelect
			ref={ ref }
			className={ classes }
			onChange={ handleOnChange }
			selectSize={ size }
			tabIndex={ isTabbable ? undefined : -1 }
			value={ unit }
			{ ...props }
		>
			{ units.map( ( option ) => (
				<option value={ option.value } key={ option.value }>
					{ option.label }
				</option>
			) ) }
		</UnitSelect>
	);
}
export default forwardRef( UnitSelectControl );
