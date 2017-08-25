/**
 * WordPress dependencies
 */
import { withInstanceId, FormToggle } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function ToggleControl( { label, checked, help, instanceId, onChange } ) {
	const id = 'inspector-toggle-control-' + instanceId;

	return (
		<BaseControl label={ label } id={ id } help={ help } className="blocks-toggle-control">
			<FormToggle
				id={ id }
				checked={ checked }
				onChange={ onChange }
				aria-describedby={ !! help ? id + '__help' : undefined }
			/>
		</BaseControl>
	);
}

export default withInstanceId( ToggleControl );
