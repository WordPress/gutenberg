/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function RangeControl( { label, value, instanceId, onChange, ...props } ) {
	const id = 'inspector-range-control-' + instanceId;

	return (
		<div className="blocks-range-control">
			<label className="blocks-range-control__label" htmlFor={ id }>{ label }</label>
			<div className="blocks-range-control__field">
				<input className="blocks-range-control__input" id={ id } type="range" value={ value } onChange={ onChange } { ...props } />
				<span>{ value }</span>
			</div>
		</div>
	);
}

export default withInstanceId( RangeControl );
