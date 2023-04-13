/**
 * WordPress dependencies
 */
import {
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUnitControl as UnitControl,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const CORNERS = {
	topLeft: __( 'Top left' ),
	topRight: __( 'Top right' ),
	bottomLeft: __( 'Bottom left' ),
	bottomRight: __( 'Bottom right' ),
};

export default function BoxInputControls( {
	onChange,
	selectedUnits,
	setSelectedUnits,
	values: valuesProp,
	...props
} ) {
	const createHandleOnChange = ( corner ) => ( next ) => {
		if ( ! onChange ) {
			return;
		}

		// Filter out CSS-unit-only values to prevent invalid styles.
		const isNumeric = ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;

		onChange( {
			...values,
			[ corner ]: nextValue,
		} );
	};

	const createHandleOnUnitChange = ( side ) => ( next ) => {
		const newUnits = { ...selectedUnits };
		newUnits[ side ] = next;
		setSelectedUnits( newUnits );
	};

	// For shorthand style & backwards compatibility, handle flat string value.
	const values =
		typeof valuesProp !== 'string'
			? valuesProp
			: {
					topLeft: valuesProp,
					topRight: valuesProp,
					bottomLeft: valuesProp,
					bottomRight: valuesProp,
			  };

	// Controls are wrapped in tooltips as visible labels aren't desired here.
	// Tooltip rendering also requires the UnitControl to be wrapped. See:
	// https://github.com/WordPress/gutenberg/pull/24966#issuecomment-685875026
	return (
		<div className="components-border-radius-control__input-controls-wrapper">
			{ Object.entries( CORNERS ).map( ( [ corner, label ] ) => {
				const [ parsedQuantity, parsedUnit ] =
					parseQuantityAndUnitFromRawValue( values[ corner ] );

				const computedUnit = values[ corner ]
					? parsedUnit
					: selectedUnits[ corner ] || selectedUnits.flat;

				return (
					<Tooltip text={ label } position="top" key={ corner }>
						<div className="components-border-radius-control__tooltip-wrapper">
							<UnitControl
								{ ...props }
								aria-label={ label }
								value={ [ parsedQuantity, computedUnit ].join(
									''
								) }
								onChange={ createHandleOnChange( corner ) }
								onUnitChange={ createHandleOnUnitChange(
									corner
								) }
								size={ '__unstable-large' }
							/>
						</div>
					</Tooltip>
				);
			} ) }
		</div>
	);
}
