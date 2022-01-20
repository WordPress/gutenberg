/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import Button from '../button';
import TextControl from '../text-control';
import { FlexItem, Flex } from '../flex';
import {
	ALL_CSS_UNITS,
	CSS_UNITS,
	hasUnits,
	getUnitsWithCurrentUnit,
} from '../unit-control/utils';

function hasCustomValue( initialValue, units = ALL_CSS_UNITS ) {
	const value = String( initialValue ).trim();

	const num = parseFloat( value );
	if ( isNaN( num ) ) {
		// If no value can be parsed, this is a custom value.
		return true;
	}

	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ );
	let unit = unitMatch?.[ 1 ] !== undefined ? unitMatch[ 1 ] : '';
	unit = unit.toLowerCase();

	if ( hasUnits( units ) && units !== false ) {
		const match = units.find( ( item ) => item.value === unit );
		// If not using an accepted unit, this is a custom value
		return match?.value === undefined;
	}

	return true;
}

export const Layout = styled( Flex )`
	min-height: 30px;
	gap: 0;
	align-items: start;
`;

export default function CustomUnitControl( props ) {
	const {
		label,
		unit,
		units: unitsProp = CSS_UNITS,
		value,
		onChange,
	} = props;

	const units = useMemo(
		() => getUnitsWithCurrentUnit( value, unit, unitsProp ),
		[ value, unit, unitsProp ]
	);
	const [ isCustomValue, setIsCustomValue ] = useState(
		!! value && hasCustomValue( value, units )
	);

	return (
		<Layout>
			{ isCustomValue && (
				<FlexItem>
					<TextControl
						autoComplete="off"
						value={ value || '' }
						onChange={ ( nextValue ) => {
							onChange( nextValue );
						} }
						help={ __( 'Enter custom CSS.' ) }
					/>
				</FlexItem>
			) }
			{ ! isCustomValue && (
				<FlexItem>
					<BaseUnitControl
						aria-label={ label }
						className="component-custom-unit-control__unit-control"
						isResetValueOnUnitChange={ false }
						{ ...props }
					/>
				</FlexItem>
			) }
			<FlexItem>
				<Button
					className="component-box-control__reset-button"
					isSecondary
					isSmall
					onClick={ () => setIsCustomValue( ! isCustomValue ) }
				>
					{ isCustomValue ? __( 'Select' ) : __( 'Custom' ) }
				</Button>
			</FlexItem>
		</Layout>
	);
}
