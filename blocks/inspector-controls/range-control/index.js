/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function RangeControl( { label, value, instanceId, onChange, ...props } ) {
	const id = 'inspector-range-control-' + instanceId;

	return (
		<BaseControl label={ label } id={ id } className="blocks-range-control">
			<input className="blocks-range-control__input" id={ id } type="range" value={ value } onChange={ onChange } { ...props } />
			<span className="blocks-range-control__hint">{ value }</span>
		</BaseControl>
	);
}

export default withInstanceId( RangeControl );
