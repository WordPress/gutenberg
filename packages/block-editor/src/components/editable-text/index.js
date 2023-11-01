/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RichText from '../rich-text';

const EditableText = forwardRef( ( props, ref ) => {
	return (
		<RichText
			ref={ ref }
			{ ...props }
			__unstableDisableFormats
			preserveWhiteSpace
		/>
	);
} );

EditableText.Content = ( { value = '', tagName: Tag = 'div', ...props } ) => {
	return <Tag { ...props }>{ value }</Tag>;
};

/**
 * Renders an editable text input in which text formatting is not allowed.
 */
export default EditableText;
