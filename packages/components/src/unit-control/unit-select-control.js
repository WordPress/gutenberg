/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { UnitSelect, UnitLabel } from './styles/unit-control-styles';
import { CSS_UNITS, hasUnits } from './utils';

/**
 * Renders a `select` if there are multiple units.
 * Otherwise, renders a non-selectable label.
 *
 * @param {Object}   props                     Component props.
 * @param {string}   [props.className]         Class to set on the `select` element.
 * @param {boolean}  [props.isTabbable=true]   Whether the control can be focused via keyboard navigation.
 * @param {Array}    [props.options=CSS_UNITS] Available units to select from.
 * @param {Function} [props.onChange=noop]     A callback function invoked when the value is changed.
 * @param {string}   [props.size="default"]    Size of the control option. Supports "default" and "small".
 * @param {string}   [props.value="px"]        Current unit.
 */
export default function UnitSelectControl( {
	className,
	isTabbable = true,
	options = CSS_UNITS,
	onChange = noop,
	size = 'default',
	value = 'px',
	...props
} ) {
	if ( ! hasUnits( options ) ) {
		return (
			<UnitLabel
				className="components-unit-control__unit-label"
				size={ size }
			>
				{ value }
			</UnitLabel>
		);
	}

	const handleOnChange = ( event ) => {
		const { value: unitValue } = event.target;
		const data = options.find( ( option ) => option.value === unitValue );

		onChange( unitValue, { event, data } );
	};

	const classes = classnames( 'components-unit-control__select', className );

	return (
		<UnitSelect
			className={ classes }
			onChange={ handleOnChange }
			size={ size }
			tabIndex={ isTabbable ? null : '-1' }
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
