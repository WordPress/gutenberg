import clsx from 'clsx';
import type { ChangeEvent, ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import styles from './style.module.scss';
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
			<div
				className={ clsx(
					'components-unit-control__unit-label',
					styles[ 'unit-label' ],
					{ [ styles[ 'is-small' ] ]: size === 'small' }
				) }
			>
				{ unit }
			</div>
		);
	}

	const handleOnChange = ( event: ChangeEvent< HTMLSelectElement > ) => {
		const { value: unitValue } = event.target;
		const data = units.find( ( option ) => option.value === unitValue );

		onChange?.( unitValue, { event, data } );
	};

	const classes = clsx(
		'components-unit-control__select',
		styles[ 'unit-select' ],
		className,
		{ [ styles[ 'is-small' ] ]: size === 'small' }
	);

	return (
		<select
			ref={ ref }
			className={ classes }
			onChange={ handleOnChange }
			tabIndex={ isTabbable ? undefined : -1 }
			value={ unit }
			{ ...props }
		>
			{ units.map( ( option ) => (
				<option value={ option.value } key={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	);
}
export default forwardRef( UnitSelectControl );
