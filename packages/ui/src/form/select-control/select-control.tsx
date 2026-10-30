import { useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import { Field, Select } from '../primitives';
import { warnSelectControlProps } from './dev-warnings';
import { Item } from './item';
import { Trigger } from './trigger';
import type { SelectControlProps } from './types';

const DEFAULT_TRIGGER = <Trigger />;

/**
 * A complete select field with integrated label and description.
 */
export const SelectControl = forwardRef<
	HTMLButtonElement,
	SelectControlProps
>( function UnforwardedSelectControl(
	{
		className,
		children,
		items,
		label,
		description,
		details,
		hideLabelFromVision,
		placeholder,
		popupWidth = 'content',
		size = 'default',
		trigger,
		...restProps
	},
	ref
) {
	if ( process.env.NODE_ENV !== 'production' ) {
		warnSelectControlProps( items, restProps.itemToStringValue );
	}

	const triggerElement = useRender( {
		render: trigger ?? DEFAULT_TRIGGER,
		ref,
		props: { placeholder, size },
	} );

	return (
		<Field.Root className={ className }>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<Select.Root items={ items } { ...restProps }>
				{ triggerElement }
				<Select.Popup width={ popupWidth }>
					{ children !== undefined
						? children
						: items?.map( ( item ) => (
								<Item
									key={ item.value ?? 'null' }
									value={ item }
									label={ item.label }
									disabled={ item.disabled }
								>
									<Select.ItemLabel>
										{ item.label }
									</Select.ItemLabel>
									{ item.description ? (
										<Select.ItemDescription>
											{ item.description }
										</Select.ItemDescription>
									) : null }
								</Item>
							) ) }
				</Select.Popup>
			</Select.Root>
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
