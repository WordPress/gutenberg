import { TextInput } from 'react-native';
/**
 * WordPress dependencies
 */
import { Component, compose, RawHTML } from '@wordpress/element';
import { withInstanceId } from '@wordpress/components';

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

const RichTextContainer = compose( [
	withInstanceId,
] )( RichText );

RichTextContainer.Content = ( { value, format = 'element', tagName: Tag, ...props } ) => {
    let children;
	switch ( format ) {
		case 'string':
			children = <RawHTML>{ value }</RawHTML>;
			break;
		default:
			children = value;
			break;
	}

	if ( Tag ) {
		return <Tag>{ children }</Tag>;
	}

	return children;
};

export default RichTextContainer;
