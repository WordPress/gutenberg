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

		const helpLabel =
			help && typeof help === 'function' ? help( checked ) : help;

		return (
			<SwitchCell
				label={ label }
				id={ id }
				help={ helpLabel }
				className={ className }
				value={ checked }
				onValueChange={ onChange }
				{ ...props }
			/>
		);
	}
);

export default ToggleControl;
