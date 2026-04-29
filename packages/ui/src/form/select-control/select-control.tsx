import { forwardRef } from '@wordpress/element';
import { Field, Select } from '../primitives';
import { SelectControlSizeContext } from './context';
import { Item } from './item';
import type { SelectControlProps } from './types';

/**
 * A complete select field with integrated label and description.
 */
export const SelectControl = forwardRef< HTMLInputElement, SelectControlProps >(
	function SelectControl(
		{
			className,
			children,
			items,
			label,
			description,
			details,
			hideLabelFromVision,
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
				<Select.Root items={ items } inputRef={ ref } { ...restProps }>
					<Select.Trigger size={ size }>
						{ triggerContent }
					</Select.Trigger>
					<Select.Popup>
						<SelectControlSizeContext.Provider value={ size }>
							{ children ||
								items?.map( ( item ) => (
									<Item
										key={ item.value }
										value={ item.value }
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
	}
);
