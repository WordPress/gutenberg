import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import type { FieldControlProps } from './types';

export const Control = forwardRef< HTMLInputElement, FieldControlProps >(
	function Control( props, ref ) {
		return <_Field.Control ref={ ref } { ...props } />;
	}
);
