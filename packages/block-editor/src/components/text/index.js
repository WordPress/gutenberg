/**
 * Internal dependencies
 */
import RichText from '../rich-text';

function Text( props ) {
	return (
		<RichText { ...props } __unstableDisableFormats />
	);
}

Text.Content = ( {
	value = '',
	tagName: Tag = 'div',
	...props
} ) => {
	return <Tag { ...props }>{ value }</Tag>;
};

/**
 * Renders an editable text input in which text formatting is not allowed.
 */
export default Text;
