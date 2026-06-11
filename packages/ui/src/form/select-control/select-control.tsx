import { forwardRef } from '@wordpress/element';
import { Field, Select } from '../primitives';
import { SelectControlSizeContext } from './context';
import { Item } from './item';
import type { SelectControlProps } from './types';

/**
 * A complete select field with integrated label and description.
 */
export const SelectControl = forwardRef<
	HTMLButtonElement,
	SelectControlProps
>( function SelectControl(
	{
		className,
		children,
		items,
		label,
		description,
		details,
		hideLabelFromVision,
		placeholder,
		size = 'default',
		triggerContent,
		...restProps
	},
	ref
) {
	return (
		<Field.Root className={ className }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<Select.Root items={ items } { ...restProps }>
				<Select.Trigger
					ref={ ref }
					placeholder={ placeholder }
					size={ size }
				>
					{ triggerContent }
				</Select.Trigger>
				<Select.Popup>
					<SelectControlSizeContext.Provider value={ size }>
						{ children !== undefined
							? children
							: items?.map( ( item ) => (
									<Item
										key={ item.value ?? 'null' }
										value={ item }
										label={ item.label }
										disabled={ item.disabled }
									>
										{ item.label }
									</Item>
							  ) ) }
					</SelectControlSizeContext.Provider>
				</Select.Popup>
			</Select.Root>
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
