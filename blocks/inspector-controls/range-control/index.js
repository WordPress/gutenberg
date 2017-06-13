/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import './style.scss';

class RangeControl extends BaseControl {
	renderControl( { value, onChange, ...props } ) {
		return (
			<div className="blocks-range-control">
				<input className="blocks-range-control__input" id={ this.id } type="range" value={ value } onChange={ onChange } { ...props } />
				<span>{ value }</span>
			</div>
		);
	}
}

export default RangeControl;
