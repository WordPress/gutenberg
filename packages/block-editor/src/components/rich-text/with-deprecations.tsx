import { forwardRef } from '@wordpress/element';
import { children as childrenSource } from '@wordpress/blocks';
import { __unstableCreateElement } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import type { ComponentType } from 'react';
import RichTextMultiline from './multiline';
import type { RichTextProps } from './types';

export function withDeprecations( Component: ComponentType< RichTextProps > ) {
	return forwardRef< HTMLElement, RichTextProps >( ( props, ref ) => {
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

			value = childrenSource.toHTML( value );
			onChange = ( newValue ) =>
				// A field always gets `onChange` with a value.
				props.onChange!(
					childrenSource.fromDOM(
						// The value was converted to an HTML string above.
						__unstableCreateElement( document, newValue as string )
							.childNodes
					)
				);
		}

		if ( props.onSplit ) {
			deprecated( 'wp.blockEditor.RichText onSplit prop', {
				since: '6.4',
				alternative: 'block.json support key: "splitting"',
			} );
		}

		// The multiline field takes the same props, with a string value.
		const NewComponent = (
			props.multiline ? RichTextMultiline : Component
		) as ComponentType< RichTextProps >;

		return (
			<NewComponent
				{ ...props }
				value={ value }
				onChange={ onChange }
				ref={ ref }
			/>
		);
	} );
}
