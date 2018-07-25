import { TextInput } from 'react-native';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class RichText extends Component {

    constructor() {
        super(...arguments)
        this.convertToHTML = this.convertToHTML.bind(this); 
    }
    
    convertToHTML( domElements ) {
        if (domElements instanceof Array) {
            return domElements.reduce( (currentValue, value) => {
                return currentValue + this.convertToHTML(value)
            }
            , "");
        } else if ( domElements.type !== undefined && domElements.props.children === undefined) {            
            return `<${ domElements.type }>`;
        } else if ( domElements.props !== undefined && domElements.props.children !== undefined && domElements.type !== undefined) {
            return `<${ domElements.type }>${ this.convertToHTML(domElements.props.children) }</${ domElements.type }>`;
        }
        return domElements;
    }

    render() {
		const { value, placeholder, onChange } = this.props;
		const content = this.convertToHTML(value);
		return (
			<TextInput
				multiline={ true }
                value={ content }
				onChangeText={ ( nextContent ) => {
					onChange( nextContent );
				}
				}
				placeholder={ placeholder }
			/>
		);
    }
        
}

export default RichText;
