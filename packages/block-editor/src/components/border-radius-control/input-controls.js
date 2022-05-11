/**
 * WordPress dependencies
 */
import {
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
	values: valuesProp,
	...props
} ) {
	const createHandleOnChange = ( corner ) => ( next ) => {
		if ( ! onChange ) {
			return;
		}

		onChange( {
			...values,
			[ corner ]: next ? next : undefined,
		} );
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
			{ Object.entries( CORNERS ).map( ( [ key, label ] ) => (
				<Tooltip text={ label } position="top" key={ key }>
					<div className="components-border-radius-control__tooltip-wrapper">
						<UnitControl
							{ ...props }
							aria-label={ label }
							value={ values[ key ] }
							onChange={ createHandleOnChange( key ) }
						/>
					</div>
				</Tooltip>
			) ) }
		</div>
	);
}
