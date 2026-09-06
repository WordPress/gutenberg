import clsx from 'clsx';
import { Field as _Field } from '@base-ui/react/field';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import type { FieldRootProps } from './types';
import { Stack } from '../../../stack';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

/**
 * A low-level component that associates an accessible label and description
 * with a single form control element.
 *
 * To label a group of multiple form control elements, use the `Fieldset` component instead.
 *
 * Simply wrapping a control with this component does not guarantee
 * accessible labeling. See examples for how to associate the label in different cases.
 */
export const Root = forwardRef< HTMLDivElement, FieldRootProps >( function Root(
	{ className, render = DEFAULT_RENDER, ...restProps },
	ref
) {
	return (
		<_Field.Root
			ref={ ref }
			className={ clsx( resetStyles[ 'box-sizing' ], className ) }
			render={ render }
			{ ...restProps }
		/>
	);
} );
