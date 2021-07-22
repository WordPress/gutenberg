/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import SwitchCell from '../mobile/bottom-sheet/switch-cell';

const ToggleControl = memo(
	( { label, checked, help, instanceId, className, onChange, ...props } ) => {
		const id = `inspector-toggle-control-${ instanceId }`;

		let helpLabel;
		if ( help ) {
			helpLabel = isFunction( help ) ? help( checked ) : help;
		}

		return (
			<SwitchCell
				label={ label }
				id={ id }
				help={ helpLabel }
				className={ className }
				value={ checked }
				onValueChange={ onChange }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
		);
	}
);

export default ToggleControl;
