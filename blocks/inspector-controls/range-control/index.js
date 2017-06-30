/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function RangeControl( { label, description, value, instanceId, onChange, ...props } ) {
	const id = 'inspector-range-control-' + instanceId;

	return (
		<BaseControl label={ label } description={ description } id={ id }>
			<div className="blocks-range-control">
				<input
					id={ id }
					type="range"
					value={ value }
					className="blocks-range-control__input"
					onChange={ onChange }
					{ ...props }
				/>
				<span className="blocks-range-control__hint">{ value }</span>
			</div>
		</BaseControl>
	);
}

export default withInstanceId( RangeControl );
