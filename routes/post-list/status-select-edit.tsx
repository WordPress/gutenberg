import type { DataFormControlProps } from '@wordpress/dataviews';
import {
	drafts,
	notAllowed,
	pending,
	published,
	scheduled,
} from '@wordpress/icons';
import { Icon, SelectControl, Stack } from '@wordpress/ui';

const ICONS: Record< string, typeof drafts > = {
	draft: drafts,
	future: scheduled,
	pending,
	private: notAllowed,
	publish: published,
};

type StatusItem = {
	value: string;
	label: string;
	description?: string;
};

function StatusLabel( { item }: { item: StatusItem } ) {
	const icon = ICONS[ item.value ];
	return (
		<Stack direction="row" align="center" gap="xs">
			{ icon && <Icon icon={ icon } size={ 16 } /> }
			<span>{ item.label }</span>
		</Stack>
	);
}

/*
 * The status control of the quick edit form: a compact alternative to the
 * radio group the editor's document sidebar uses, with the icon of each
 * status next to its label, and its description in the list.
 */
export function StatusSelectEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< any > ) {
	const items: StatusItem[] = ( field.elements ?? [] ).map(
		( { value, label, description } ) => ( {
			value: String( value ),
			label,
			description,
		} )
	);
	const value = field.getValue( { item: data } );
	const selectedItem = items.find( ( item ) => item.value === value ) ?? null;

	return (
		<SelectControl
			label={ field.label }
			hideLabelFromVision={ hideLabelFromVision }
			items={ items }
			value={ selectedItem }
			onValueChange={ ( item ) => {
				if ( item?.value ) {
					onChange(
						field.setValue( { item: data, value: item.value } )
					);
				}
			} }
			disabled={ field.isDisabled( { item: data, field } ) }
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
