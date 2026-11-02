import { forwardRef } from '@wordpress/element';
import type {
	ForwardRefExoticComponent,
	ReactElement,
	RefAttributes,
} from 'react';
import RichText from '../rich-text';
import type { EditableTextContentProps, EditableTextProps } from './types';

// The `Content` static is assigned below.
const EditableText = forwardRef< HTMLElement, EditableTextProps >(
	( props, ref ) => {
		return <RichText ref={ ref } { ...props } __unstableDisableFormats />;
	}
) as ForwardRefExoticComponent<
	EditableTextProps & RefAttributes< HTMLElement >
> & {
	Content: ( props: EditableTextContentProps ) => ReactElement;
};

EditableText.Content = function Content( {
	value = '',
	tagName: Tag = 'div',
	...props
}: EditableTextContentProps ) {
	return <Tag { ...props }>{ value }</Tag>;
};

/**
 * Renders an editable text input in which text formatting is not allowed.
 */
export default EditableText;
