import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import type { FieldItemProps } from './types';

export const Item: React.ForwardRefExoticComponent<
	FieldItemProps & React.RefAttributes< HTMLDivElement >
> = forwardRef( function Item( props, ref ) {
	return <_Field.Item ref={ ref } { ...props } />;
} );
