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
import type { WordPressComponentProps } from '../ui/context';
import { UnitSelect, UnitLabel } from './styles/unit-control-styles';
import { CSS_UNITS, hasUnits } from './utils';
import type { UnitSelectControlProps } from './types';

/**
 * Renders a `select` if there are multiple units.
 * Otherwise, renders a non-selectable label.
 *
 * @param  props                      Component props.
 * @param  props.className            Class to set on the `select` element.
 * @param  props.isUnitSelectTabbable Whether the control can be focused via keyboard navigation.
 * @param  props.onChange             A callback function invoked when the value is changed.
 * @param  props.size                 Size of the control option. Supports "default" and "small".
 * @param  props.unit                 Current unit.
 * @param  props.units                Available units to select from.
 */
export default function UnitSelectControl( {
	className,
	isUnitSelectTabbable: isTabbable = true,
	onChange = noop,
	size = 'default',
	unit = 'px',
	units = CSS_UNITS,
	...props
}: WordPressComponentProps< UnitSelectControlProps, 'select', false > ) {
	if ( ! units || ! hasUnits( units ) || units?.length === 1 ) {
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

		onChange( unitValue, { event, data } );
	};

	const classes = classnames( 'components-unit-control__select', className );

	return (
		<UnitSelect
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
