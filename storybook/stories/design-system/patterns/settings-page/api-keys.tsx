import type { ComponentProps, ReactElement } from 'react';
import type { Action, Field, View } from '@wordpress/dataviews';
import {
	DataForm,
	DataViews,
	filterSortAndPaginate,
	useFormValidity,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { Badge, Card } from '@wordpress/ui';
import { simulateRequest, useNotify } from './shared';

export type ApiKey = {
	id: string;
	name: string;
	notes: string;
	prefix: string;
	access: string;
	lastUsed: string;
	active: boolean;
};

export const initialKeys: ApiKey[] = [
	{
		id: 'mobile-app',
		name: 'Mobile app',
		notes: 'Used by the iOS and Android apps.',
		prefix: 'wp_live_4f2a',
		access: 'write',
		lastUsed: '2 hours ago',
		active: true,
	},
	{
		id: 'analytics',
		name: 'Analytics dashboard',
		notes: '',
		prefix: 'wp_live_9c1e',
		access: 'read',
		lastUsed: 'Yesterday',
		active: true,
	},
	{
		id: 'backup',
		name: 'Backup service',
		notes: 'Paused while we switch providers.',
		prefix: 'wp_live_77bd',
		access: 'admin',
		lastUsed: '3 weeks ago',
		active: false,
	},
	{
		id: 'staging',
		name: 'Staging site',
		notes: '',
		prefix: 'wp_test_02f8',
		access: 'write',
		lastUsed: 'Never',
		active: true,
	},
];

export const emptyKey: ApiKey = {
	id: '',
	name: '',
	notes: '',
	prefix: '',
	access: 'read',
	lastUsed: 'Never',
	active: true,
};

const ACCESS_LEVELS = [
	{ value: 'read', label: 'Read only' },
	{ value: 'write', label: 'Read and write' },
	{ value: 'admin', label: 'Full access' },
];

export const keyFields: Field< ApiKey >[] = [
	{
		id: 'name',
		label: 'Name',
		type: 'text',
		enableHiding: false,
		isValid: { required: true },
	},
	{
		id: 'notes',
		label: 'Notes',
		type: 'text',
		Edit: 'textarea',
		description: 'Where the key is used, for whoever manages it next.',
		enableSorting: false,
	},
	{
		id: 'prefix',
		label: 'Key',
		type: 'text',
		render: ( { item } ) => <>{ item.prefix }…</>,
		enableSorting: false,
		readOnly: true,
	},
	{
		id: 'access',
		label: 'Access',
		type: 'text',
		Edit: 'radio',
		elements: ACCESS_LEVELS,
		enableSorting: false,
	},
	{
		id: 'lastUsed',
		label: 'Last used',
		type: 'text',
		enableSorting: false,
		readOnly: true,
	},
	{
		id: 'active',
		label: 'Status',
		type: 'boolean',
		Edit: 'checkbox',
		render: ( { item } ) =>
			item.active ? (
				<Badge intent="stable">Active</Badge>
			) : (
				<Badge intent="none">Inactive</Badge>
			),
	},
];

/**
 * The fields people edit. `active` gets its own label in the editors,
 * where "Status" alone would not say what the checkbox does.
 */
export const keyFormFields: Field< ApiKey >[] = keyFields.map( ( field ) =>
	field.id === 'active'
		? { ...field, label: 'Allow requests with this key' }
		: field
);

export const keyForm = {
	layout: { type: 'regular' as const },
	fields: [ 'name', 'notes', 'access', 'active' ],
};

/**
 * The editor for one record, used by the subpage, dialog and drawer.
 */
export function KeyForm( {
	data,
	onChange,
}: {
	data: ApiKey;
	onChange: ( edits: Partial< ApiKey > ) => void;
} ) {
	const { validity } = useFormValidity( data, keyFormFields, keyForm );
	return (
		<DataForm< ApiKey >
			data={ data }
			fields={ keyFormFields }
			form={ keyForm }
			validity={ validity }
			onChange={ onChange }
		/>
	);
}

/**
 * State for editing one record in an overlay. The overlay saves on its own:
 * its Save applies the draft, closes the overlay and confirms in a snackbar.
 */
export function useKeyEditor( onSave: ( key: ApiKey ) => void ) {
	const [ isOpen, setIsOpen ] = useState( false );
	// The record stays set after closing, so the overlay keeps its content
	// while it animates out.
	const [ record, setRecord ] = useState< ApiKey >( emptyKey );
	const [ draft, setDraft ] = useState< ApiKey >( emptyKey );
	const [ isSaving, setIsSaving ] = useState( false );
	const { isValid } = useFormValidity( draft, keyFormFields, keyForm );
	const notify = useNotify();

	const open = ( key: ApiKey ) => {
		setRecord( key );
		setDraft( key );
		setIsOpen( true );
	};

	const close = () => {
		if ( ! isSaving ) {
			setIsOpen( false );
		}
	};

	const onChange = ( edits: Partial< ApiKey > ) =>
		setDraft( ( previous ) => ( { ...previous, ...edits } ) );

	const isDirty = JSON.stringify( draft ) !== JSON.stringify( record );
	const [ isConfirmingDiscard, setIsConfirmingDiscard ] = useState( false );

	/**
	 * Cancel is an explicit choice to discard the draft. Any other way of
	 * closing (Escape, or swiping a drawer) asks first when there are
	 * unsaved edits.
	 */
	const onOpenChange = (
		nextOpen: boolean,
		{ reason }: { reason: string }
	) => {
		if ( nextOpen || isSaving ) {
			return;
		}
		if ( reason === 'close-press' || ! isDirty ) {
			close();
		} else {
			setIsConfirmingDiscard( true );
		}
	};

	const discard = {
		isConfirming: isConfirmingDiscard,
		keepEditing: () => setIsConfirmingDiscard( false ),
		confirm: () => {
			setIsConfirmingDiscard( false );
			close();
		},
	};

	const save = async () => {
		setIsSaving( true );
		await simulateRequest();
		onSave( draft );
		setIsSaving( false );
		setIsOpen( false );
		notify( 'API key saved.' );
	};

	return {
		record,
		isOpen,
		isNew: ! record.id,
		draft,
		onChange,
		isDirty,
		isValid,
		isSaving,
		open,
		close,
		onOpenChange,
		discard,
		save,
	};
}

/**
 * Holds the saved records, above any route or overlay that edits them.
 */
export function useKeys() {
	const [ keys, setKeys ] = useState( initialKeys );

	const saveKey = ( key: ApiKey ) => {
		setKeys( ( current ) => {
			if ( key.id && current.some( ( { id } ) => id === key.id ) ) {
				return current.map( ( item ) =>
					item.id === key.id ? key : item
				);
			}
			const suffix = Date.now().toString( 16 ).slice( -4 );
			return [
				...current,
				{
					...key,
					id: `key-${ suffix }`,
					prefix: `wp_live_${ suffix }`,
				},
			];
		} );
	};

	const revokeKey = ( key: ApiKey ) => {
		setKeys( ( current ) => current.filter( ( { id } ) => id !== key.id ) );
	};

	return { keys, saveKey, revokeKey };
}

/**
 * The records table, in a card. The page title already names the records,
 * so the card has no title of its own.
 */
export function KeysTable( {
	keys,
	actions,
	onClickItem,
	renderItemLink,
}: {
	keys: ApiKey[];
	actions?: Action< ApiKey >[];
	onClickItem?: ( item: ApiKey ) => void;
	renderItemLink?: (
		props: { item: ApiKey } & ComponentProps< 'a' >
	) => ReactElement;
} ) {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		layout: {},
		titleField: 'name',
		fields: [ 'prefix', 'access', 'lastUsed', 'active' ],
	} );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( keys, view, keyFields ),
		[ keys, view ]
	);

	return (
		<Card.Root>
			<Card.Content>
				<Card.FullBleed>
					<DataViews
						data={ data }
						fields={ keyFields }
						view={ view }
						onChangeView={ setView }
						paginationInfo={ paginationInfo }
						defaultLayouts={ { table: {} } }
						actions={ actions }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
					/>
				</Card.FullBleed>
			</Card.Content>
		</Card.Root>
	);
}
