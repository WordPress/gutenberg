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

function ToggleControl( { label, checked, instanceId, onChange } ) {
	const id = 'inspector-toggle-control-' + instanceId;

	return (
		<BaseControl label={ label } id={ id } className={ [ 'blocks-toggle-control' ] }>
			<Toggle id={ id } checked={ checked } onChange={ onChange } />
		</BaseControl>
	);
}

export default withInstanceId( ToggleControl );
