/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { children as childrenSource } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { __unstableCreateElement } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import RichTextMultiline from './multiline';

export function withDeprecations( Component ) {
	return forwardRef( ( props, ref ) => {
		let value = props.value;
		let onChange = props.onChange;

		// Handle deprecated format.
		if ( Array.isArray( value ) ) {
			deprecated( 'wp.blockEditor.RichText value prop as children type', {
				since: '6.1',
				version: '6.3',
				alternative: 'value prop as string',
				link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
			} );

			value = childrenSource.toHTML( props.value );
			onChange = ( newValue ) =>
				props.onChange(
					childrenSource.fromDOM(
						__unstableCreateElement( document, newValue ).childNodes
					)
				);
		}

		const NewComponent = props.multiline ? RichTextMultiline : Component;
		const instanceId = useInstanceId( NewComponent );

		return (
			<NewComponent
				{ ...props }
				identifier={ props.identifier || instanceId }
				value={ value }
				onChange={ onChange }
				ref={ ref }
			/>
		);
	} );
}
