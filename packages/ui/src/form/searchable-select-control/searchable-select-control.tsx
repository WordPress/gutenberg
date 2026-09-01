import { forwardRef } from '@wordpress/element';
import { Field, SearchableSelect } from '../primitives';
import type { SearchableSelectControlProps } from './types';

/**
 * A complete searchable select field with integrated label and description.
 */
export const SearchableSelectControl = forwardRef<
	HTMLButtonElement,
	SearchableSelectControlProps
>( function SearchableSelectControl(
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
			<Field.Control
				render={ <SearchableSelect ref={ ref } { ...restProps } /> }
			/>
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
