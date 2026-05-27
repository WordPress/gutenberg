import clsx from 'clsx';
import { Fieldset as _Fieldset } from '@base-ui/react/fieldset';
import { forwardRef } from '@wordpress/element';
import fieldStyles from '../../../utils/css/field.module.css';
import { VisuallyHidden } from '../../../visually-hidden';
import type { FieldsetLegendProps } from './types';

export const FieldsetLegend = forwardRef< HTMLDivElement, FieldsetLegendProps >(
	function FieldsetLegend(
		{ className, hideFromVision, ...restProps },
		ref
	) {
		const legend = (
			<_Fieldset.Legend
				ref={ ref }
				className={ clsx( fieldStyles.label, className ) }
				{ ...restProps }
			/>
		);

		// VisuallyHidden is the host so that _Fieldset.Legend's semantic
		// element is preserved. See VisuallyHidden docs for details.
		if ( hideFromVision ) {
			return <VisuallyHidden render={ legend } />;
		}

		return legend;
	}
);
