import type { DataFormControlProps } from '@wordpress/dataviews';
import { Icon, RadioGroupControl, SelectControl, Stack } from '@wordpress/ui';
import { STATUS_ICONS } from './icons';
import type { PostWithStatus } from './types';

type StatusItem = {
	value: string;
	label: string;
	description?: string;
};

function StatusLabel( { item }: { item: StatusItem } ) {
	const icon = STATUS_ICONS[ item.value ];
	return (
		<Stack direction="row" align="center" gap="xs">
			{ icon && <Icon icon={ icon } size={ 16 } /> }
			<span>{ item.label }</span>
		</Stack>
	);
}

/*
 * The status control: a radio group with the description of each status, or,
 * when a form asks for it with the `compact` setting, a select with the icon
 * of each status next to its label and its description in the list. Trash
 * is not offered: trashing a post is an action of its own.
 */
export default function StatusEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: DataFormControlProps< PostWithStatus > ) {
	const items: StatusItem[] = ( field.elements ?? [] )
		.filter( ( { value } ) => value !== 'trash' )
		.map( ( { value, label, description } ) => ( {
			value: String( value ),
			label,
			description,
		} ) );
	const value = field.getValue( { item: data } );
	const disabled = field.isDisabled( { item: data, field } );
	const onValueChange = ( newValue: string ) =>
		onChange( field.setValue( { item: data, value: newValue } ) );

	if ( ! config?.compact ) {
		return (
			<RadioGroupControl
				label={ field.label }
				hideLabelFromVision={ hideLabelFromVision }
				items={ items }
				value={ value ?? '' }
				onValueChange={ onValueChange }
				disabled={ disabled }
			/>
		);
	}

	const selectedItem = items.find( ( item ) => item.value === value ) ?? null;

	return (
		<SelectControl
			label={ field.label }
			hideLabelFromVision={ hideLabelFromVision }
			items={ items }
			value={ selectedItem }
			onValueChange={ ( item ) => {
				if ( item?.value ) {
					onValueChange( item.value );
				}
			} }
			disabled={ disabled }
			// Without a value (a bulk edit), the default trigger shows the
			// placeholder.
			trigger={
				selectedItem ? (
					<SelectControl.Trigger>
						<StatusLabel item={ selectedItem } />
					</SelectControl.Trigger>
				) : undefined
			}
		>
			{ items.map( ( item ) => (
				<SelectControl.Item
					key={ item.value }
					value={ item }
					label={ item.label }
				>
					<SelectControl.ItemLabel>
						<StatusLabel item={ item } />
					</SelectControl.ItemLabel>
					{ item.description ? (
						<SelectControl.ItemDescription>
							{ item.description }
						</SelectControl.ItemDescription>
					) : null }
				</SelectControl.Item>
			) ) }
		</SelectControl>
	);
}
