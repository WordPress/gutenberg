/**
 * Internal dependencies
 */
import RichText from '../rich-text';

function Editable( props ) {
	return <RichText { ...props } __unstableDisableFormats />;
}

Editable.Content = ( { value = '', tagName: Tag = 'div', ...props } ) => {
	return <Tag { ...props }>{ value }</Tag>;
};

/**
 * Renders an editable text input in which text formatting is not allowed.
 */
export default Editable;
