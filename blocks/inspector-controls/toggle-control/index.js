/**
 * WordPress dependencies
 */
import { withInstanceId, FormToggle } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function ToggleControl( { label, checked, instanceId, onChange, ...props } ) {
	const id = 'inspector-toggle-control-' + instanceId;

	return (
		<div className="blocks-toggle-control">
			<label className="blocks-toggle-control__label" htmlFor={ id }>{ label }</label>
			<FormToggle id={ id } checked={ checked } onChange={ onChange } />
		</div>
	);
}

export default withInstanceId( ToggleControl );
