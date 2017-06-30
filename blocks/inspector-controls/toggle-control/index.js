/**
 * WordPress dependencies
 */
import { withInstanceId, FormToggle } from 'components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function ToggleControl( { label, description, checked, instanceId, onChange } ) {
	const id = 'inspector-toggle-control-' + instanceId;

	return (
		<BaseControl
			id={ id }
			label={ label }
			description={ description }
			className="blocks-toggle-control"
		>
			<FormToggle id={ id } checked={ checked } onChange={ onChange } />
		</BaseControl>
	);
}

export default withInstanceId( ToggleControl );
