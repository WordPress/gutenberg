import type { ComponentProps, FormEvent, ReactElement } from 'react';
import type { Action, Field, View } from '@wordpress/dataviews';
import {
	DataForm,
	DataViews,
	filterSortAndPaginate,
	useFormValidity,
} from '@wordpress/dataviews';
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
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
		// Marks each row with its record, so a pattern can find the row for a
		// record by ID rather than by name, which needn't be unique.
		render: ( { item } ) => (
			<span data-key-id={ item.id }>{ item.name }</span>
		),
		enableGlobalSearch: true,
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
 * Where focus should land once a record's row leaves the table, because it
 * was revoked or a save moved it out of the filtered view: the next record,
 * the previous one when it was last, or Add API key when none remain.
 * Captured before the row is removed, so the element is one that stays.
 * Rows are matched by record ID, since two records can share a name.
 */
export function focusTargetAfterRemoval(
	id: string,
	scope: ParentNode | null,
	addButton: HTMLElement | null
) {
	const titles = findRowTitles( scope );
	const index = titles.findIndex( ( title ) => rowTitleId( title ) === id );
	// `titles[-1]` is undefined, so the first record falls through to the next.
	const remaining = titles[ index + 1 ] ?? titles[ index - 1 ];
	if ( index !== -1 && remaining ) {
		return remaining;
	}
	return addButton;
}

function findRowTitles( scope: ParentNode | null ) {
	return [
		...( scope ?? document ).querySelectorAll< HTMLElement >(
			'.dataviews-title-field[role="button"]'
		),
	];
}

function rowTitleId( title: HTMLElement ) {
	return title.querySelector< HTMLElement >( '[data-key-id]' )?.dataset.keyId;
}

/**
 * State for editing one record in an overlay. The overlay saves on its own:
 * its Save submits the form, which applies the draft, closes the overlay and
 * confirms in a snackbar. Invalid fields stop the submission and show their
 * errors instead.
 */
export function useKeyEditor(
	onSave: ( key: ApiKey ) => ApiKey,
	{
		scopeRef,
		addButtonRef,
	}: {
		scopeRef: { current: HTMLElement | null };
		addButtonRef: { current: HTMLElement | null };
	}
) {
	const [ isOpen, setIsOpen ] = useState( false );
	// The record stays set after closing, so the overlay keeps its content
	// while it animates out.
	const [ record, setRecord ] = useState< ApiKey >( emptyKey );
	const [ draft, setDraft ] = useState< ApiKey >( emptyKey );
	const [ isSaving, setIsSaving ] = useState( false );
	const draftRef = useRef( draft );
	useEffect( () => {
		draftRef.current = draft;
	}, [ draft ] );
	const formId = useId();
	const notify = useNotify();

	// Set by a save, for the overlay to read when it closes. A filtered table
	// drops a row whose saved values no longer match, and the overlay would
	// otherwise return focus to a control that's gone.
	const savedFocusRef = useRef< {
		row: HTMLElement;
		target: HTMLElement | null;
	} | null >( null );

	const open = ( key: ApiKey ) => {
		savedFocusRef.current = null;
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

	// Reloading or closing the tab can only be guarded by the browser's own
	// warning.
	// A pending save counts too: it hasn't been applied yet.
	const shouldWarnOnUnload = isOpen && ( isDirty || isSaving );
	useEffect( () => {
		if ( ! shouldWarnOnUnload ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) =>
			event.preventDefault();
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ shouldWarnOnUnload ] );

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
		const submitted = draft;
		setIsSaving( true );
		await simulateRequest();
		// The row is still in the table until the save re-renders it. When an
		// earlier save already took it out, and edits made meanwhile kept the
		// overlay open, keep the target that save found.
		const row = submitted.id
			? findRowTitles( scopeRef.current ).find(
					( title ) => rowTitleId( title ) === submitted.id
				)
			: undefined;
		if ( row ) {
			savedFocusRef.current = {
				row,
				target: focusTargetAfterRemoval(
					submitted.id,
					scopeRef.current,
					addButtonRef.current
				),
			};
		}
		const saved = onSave( submitted );
		setIsSaving( false );
		notify( 'API key saved.' );
		// Edits made while the save was pending stay open as unsaved changes,
		// on top of the record that was just saved.
		const latest = draftRef.current;
		if ( JSON.stringify( latest ) === JSON.stringify( submitted ) ) {
			setIsOpen( false );
		} else {
			setRecord( saved );
			setDraft( { ...latest, id: saved.id, prefix: saved.prefix } );
		}
	};

	/**
	 * Passed to the overlay's `finalFocus`. Returns focus to whatever opened
	 * the overlay, unless a save took the record's row out of the table.
	 * Base UI also calls it on re-renders while the overlay is open, so it
	 * only reads the target; opening the editor again clears it.
	 */
	const finalFocus = () => {
		const saved = savedFocusRef.current;
		if (
			saved?.row &&
			! saved.row.isConnected &&
			saved.target?.isConnected
		) {
			return saved.target;
		}
		return true;
	};

	const onSubmit = ( event: FormEvent ) => {
		event.preventDefault();
		if ( ! isSaving ) {
			save();
		}
	};

	return {
		record,
		isOpen,
		isNew: ! record.id,
		draft,
		onChange,
		isDirty,
		isSaving,
		formId,
		onSubmit,
		open,
		close,
		onOpenChange,
		discard,
		save,
		finalFocus,
	};
}

/**
 * Holds the saved records, above any route or overlay that edits them.
 */
export function useKeys() {
	const [ keys, setKeys ] = useState( initialKeys );

	/**
	 * Applies a record and returns it as saved, with an id and key when it
	 * is new.
	 */
	const saveKey = ( key: ApiKey ): ApiKey => {
		if ( key.id ) {
			setKeys( ( current ) =>
				current.map( ( item ) => ( item.id === key.id ? key : item ) )
			);
			return key;
		}
		const suffix = Date.now().toString( 16 ).slice( -4 );
		const saved = {
			...key,
			id: `key-${ suffix }`,
			prefix: `wp_live_${ suffix }`,
		};
		setKeys( ( current ) => [ ...current, saved ] );
		return saved;
	};

	const revokeKey = ( key: ApiKey ) => {
		setKeys( ( current ) => current.filter( ( { id } ) => id !== key.id ) );
	};

	return { keys, saveKey, revokeKey };
}

export const defaultKeysView: View = {
	type: 'table',
	search: '',
	page: 1,
	perPage: 10,
	filters: [],
	layout: {},
	titleField: 'name',
	fields: [ 'prefix', 'access', 'lastUsed', 'active' ],
};

/**
 * The records table, in a card. The page title already names the records,
 * so the card has no title of its own.
 */
export function KeysTable( {
	keys,
	actions,
	onClickItem,
	renderItemLink,
	view: controlledView,
	onChangeView,
}: {
	keys: ApiKey[];
	/**
	 * Pass the view from above when the table unmounts while people edit a
	 * record, as it does when records open a subpage, so their search,
	 * filters and page are still there when they come back.
	 */
	view?: View;
	onChangeView?: ( view: View ) => void;
	actions?: Action< ApiKey >[];
	onClickItem?: ( item: ApiKey ) => void;
	renderItemLink?: (
		props: { item: ApiKey } & ComponentProps< 'a' >
	) => ReactElement;
} ) {
	const [ ownView, setOwnView ] = useState< View >( defaultKeysView );
	const view = controlledView ?? ownView;
	const setView = onChangeView ?? setOwnView;

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
