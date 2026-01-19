import clsx from 'clsx';
import { Fieldset as _Fieldset } from '@base-ui/react/fieldset';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import type { FieldsetLegendProps } from './types';

export const FieldsetLegend = forwardRef< HTMLDivElement, FieldsetLegendProps >(
	function FieldsetLegend( { className, ...restProps }, ref ) {
		return (
			<_Fieldset.Legend
				ref={ ref }
				className={ clsx( fieldStyles.label, className ) }
				{ ...restProps }
			/>
		);
	}
);
