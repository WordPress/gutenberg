/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';
// eslint-disable-next-line no-restricted-imports
import type { ChangeEvent } from 'react';

/**
 * Internal dependencies
 */
import { UnitSelect, UnitLabel } from './styles/unit-control-styles';
import { CSS_UNITS, hasUnits } from './utils';
import type { UnitSelectControlProps } from './types';

/**
 * Renders a `select` if there are multiple units.
 * Otherwise, renders a non-selectable label.
 *
 * @param  props            Component props.
 * @param  props.className  Class to set on the `select` element.
 * @param  props.isTabbable Whether the control can be focused via keyboard navigation.
 * @param  props.options    Available units to select from.
 * @param  props.onChange   A callback function invoked when the value is changed.
 * @param  props.size       Size of the control option. Supports "default" and "small".
 * @param  props.value      Current unit.
 */
export default function UnitSelectControl( {
	className,
	isTabbable = true,
	options = CSS_UNITS,
	onChange = noop,
	size = 'default',
	value = 'px',
	...props
}: UnitSelectControlProps ) {
	if ( ! hasUnits( options ) || options.length === 1 ) {
		return (
			<UnitLabel
				className="components-unit-control__unit-label"
				selectSize={ size }
			>
				{ value }
			</UnitLabel>
		);
	}

	const handleOnChange = ( event: ChangeEvent< HTMLSelectElement > ) => {
		const { value: unitValue } = event.target;
		const data = options.find( ( option ) => option.value === unitValue );

		onChange( unitValue, { event, data } );
	};

	const classes = classnames( 'components-unit-control__select', className );

	return (
		<UnitSelect
			className={ classes }
			onChange={ handleOnChange }
			selectSize={ size }
			tabIndex={ isTabbable ? null : -1 }
			value={ value }
			{ ...props }
		>
			{ options.map( ( option ) => (
				<option value={ option.value } key={ option.value }>
					{ option.label }
				</option>
			) ) }
		</UnitSelect>
	);
}
