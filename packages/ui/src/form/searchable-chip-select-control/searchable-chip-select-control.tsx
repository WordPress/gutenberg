import { forwardRef } from '@wordpress/element';
import { Field, SearchableChipSelect } from '../primitives';
import type { SearchableChipSelectControlProps } from './types';

/**
 * A complete searchable multi-select field with chips, integrated label,
 * and description.
 */
export const SearchableChipSelectControl = forwardRef<
	HTMLInputElement,
	SearchableChipSelectControlProps
>( function SearchableChipSelectControl(
	{
		className,
		label,
		description,
		details,
		hideLabelFromVision,
		...restProps
	},
	ref
) {
	return (
		<Field.Root className={ className }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<SearchableChipSelect ref={ ref } { ...restProps } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
