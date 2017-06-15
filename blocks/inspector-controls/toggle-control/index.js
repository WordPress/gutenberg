/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';
import Toggle from 'components/form-toggle';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function ToggleControl( { label, checked, instanceId, onChange, ...props } ) {
	const id = 'inspector-toggle-control-' + instanceId;

	return (
		<BaseControl type="toggle" label={ label } id={ id }>
  			<Toggle id={ id } checked={ checked } onChange={ onChange } />
		</BaseControl>
	);
}

export default withInstanceId( ToggleControl );
