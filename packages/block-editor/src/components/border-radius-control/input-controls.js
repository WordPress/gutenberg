/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';

export default function BoxInputControls( {
	onChange = noop,
	values: valuesProp,
	...props
} ) {
	const createHandleOnChange = ( corner ) => ( next ) => {
		onChange( { ...values, [ corner ]: next } );
	};

	// For backwards compatibility, handle possible flat string value.
	const values =
		typeof valuesProp !== 'string'
			? valuesProp
			: {
					topLeft: valuesProp,
					topRight: valuesProp,
					bottomLeft: valuesProp,
					bottomRight: valuesProp,
			  };

	return (
		<div className="components-border-radius-control__input-controls-wrapper">
			<UnitControl
				{ ...props }
				isFirst={ true }
				isLast={ true }
				value={ values.topLeft }
				onChange={ createHandleOnChange( 'topLeft' ) }
			/>
			<UnitControl
				{ ...props }
				isLast={ true }
				value={ values.topRight }
				onChange={ createHandleOnChange( 'topRight' ) }
			/>
			<UnitControl
				{ ...props }
				isFirst={ true }
				value={ values.bottomLeft }
				onChange={ createHandleOnChange( 'bottomLeft' ) }
			/>
			<UnitControl
				{ ...props }
				isLast={ true }
				value={ values.bottomRight }
				onChange={ createHandleOnChange( 'bottomRight' ) }
			/>
		</div>
	);
}
