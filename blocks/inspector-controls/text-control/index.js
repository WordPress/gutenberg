/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import './style.scss';

class TextControl extends BaseControl {
	renderControl( { value, onChange, type = 'text', ...props } ) {
		const onChangeValue = ( event ) => onChange( event.target.value );
		
		return (
			<input className="blocks-text-control__input" type={ type } id={ this.id } value={ value } onChange={ onChangeValue } { ...props } />
		);
	}
}

export default TextControl;
