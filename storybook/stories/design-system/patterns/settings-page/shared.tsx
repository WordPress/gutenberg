import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';
import { Page } from '@wordpress/admin-ui';
import { SnackbarList } from '@wordpress/components';
import type { Field } from '@wordpress/dataviews';
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import {
	createContext,
	useCallback,
	useContext,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { Button, Card, Notice, Stack, Text, Tooltip } from '@wordpress/ui';
import type { SubpageStatus } from './router';
import styles from './style.module.css';
import { UnsavedChangesGuard } from './unsaved-changes';

const SAVE_DELAY = 800;

export function simulateRequest() {
	return new Promise( ( resolve ) => setTimeout( resolve, SAVE_DELAY ) );
}

const NotifyContext = createContext< ( message: string ) => void >( () => {} );

/**
 * Confirms a save that has no other visible effect.
 */
export function useNotify() {
	return useContext( NotifyContext );
}

const OverlayContainerContext = createContext< HTMLElement | null >( null );

/**
 * The element dialogs and drawers portal into, so they stay inside their
 * example instead of covering the whole docs page.
 */
export function useOverlayContainer() {
	return useContext( OverlayContainerContext );
}

/**
 * The frame every example renders in. It hosts the snackbar list, which the
 * Save & Submit guidance uses to confirm a successful save, and the
 * container that overlays render into.
 */
export function SettingsExample( { children }: { children: ReactNode } ) {
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	const [ overlayContainer, setOverlayContainer ] =
		useState< HTMLDivElement | null >( null );
	const noticeIdRef = useRef( 0 );

	const notify = useCallback( ( message: string ) => {
		noticeIdRef.current += 1;
		setNotices( [
			{ id: String( noticeIdRef.current ), content: message },
		] );
	}, [] );

	return (
		<NotifyContext.Provider value={ notify }>
			<OverlayContainerContext.Provider value={ overlayContainer }>
				<div className={ styles.example }>
					{ children }
					<SnackbarList
						className={ styles.snackbars }
						notices={ notices }
						onRemove={ ( id ) =>
							setNotices( ( current ) =>
								current.filter( ( notice ) => notice.id !== id )
							)
						}
					/>
					<div
						ref={ setOverlayContainer }
						className={ styles.overlays }
					/>
				</div>
			</OverlayContainerContext.Provider>
		</NotifyContext.Provider>
	);
}

/**
 * Manual save model: edits are held in a local draft and applied together
 * when the user saves. The saved value lives above the page, so it survives
 * navigating between pages. A save that fails keeps the draft, so people can
 * try again. Edits made while a save is pending stay in the draft, unsaved.
 */
export function useManualSave< T extends object >(
	saved: T,
	onSave: ( data: T ) => unknown,
	message = 'Settings saved.'
) {
	const [ data, setData ] = useState( saved );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasFailed, setHasFailed ] = useState( false );
	const notify = useNotify();

	const isDirty = JSON.stringify( data ) !== JSON.stringify( saved );

	const onChange = useCallback( ( edits: Partial< T > ) => {
		setData( ( previous ) => ( { ...previous, ...edits } ) );
	}, [] );

	const save = async () => {
		setIsSaving( true );
		setHasFailed( false );
		try {
			await simulateRequest();
			await onSave( data );
			notify( message );
		} catch {
			setHasFailed( true );
		}
		setIsSaving( false );
	};

	return { data, onChange, isDirty, isSaving, hasFailed, save };
}

/**
 * Submits the form it belongs to, so the form's own validation runs first:
 * invalid fields show their errors and take focus instead of saving. It stays
 * enabled while fields are invalid, and is only disabled while there is
 * nothing to save, which its tooltip explains, or while saving.
 */
export function SaveButton( {
	form,
	hasChanges,
	isSaving,
	size,
	children = 'Save changes',
}: {
	form: string;
	hasChanges: boolean;
	isSaving: boolean;
	size?: ComponentProps< typeof Button >[ 'size' ];
	children?: ReactNode;
} ) {
	return (
		<Tooltip.Root disabled={ hasChanges }>
			<Tooltip.Trigger
				render={
					<Button
						type="submit"
						form={ form }
						size={ size }
						disabled={ ! hasChanges || isSaving }
						loading={ isSaving }
						loadingAnnouncement="Saving changes"
					>
						{ children }
					</Button>
				}
			/>
			<Tooltip.Popup>No unsaved changes</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * Explains a failed save at the top of the form and offers a retry. The list
 * stays mounted so the notice is announced when it appears.
 */
export function SaveFailedNotice( {
	hasFailed,
	onRetry,
}: {
	hasFailed: boolean;
	onRetry: () => void;
} ) {
	return (
		<Notice.List className={ styles.notices }>
			{ hasFailed && (
				<Notice.Root intent="error">
					<Notice.Title>Your changes couldn’t be saved.</Notice.Title>
					<Notice.Description>
						They’re still here. Check your connection, then try
						again.
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ onRetry }>
							Try again
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			) }
		</Notice.List>
	);
}

type PageHeaderProps = Omit<
	ComponentProps< typeof Page >,
	'children' | 'actions'
>;

/**
 * A settings page (or subpage) that owns one manual-save draft. Its fields
 * sit in a form, which the Save in the `Page` header actions submits. Render
 * it with a `key` per location, so each page starts from its saved values,
 * and inside a router, which the unsaved changes guard uses to hold
 * navigation.
 */
export function SettingsFormPage< T extends object >( {
	saved,
	onSave,
	children,
	...pageProps
}: PageHeaderProps & {
	saved: T;
	onSave: ( data: T ) => unknown;
	children: ( form: {
		data: T;
		onChange: ( edits: Partial< T > ) => void;
	} ) => ReactNode;
} ) {
	const { data, onChange, isDirty, isSaving, hasFailed, save } =
		useManualSave( saved, onSave );
	const formId = useId();
	const formRef = useRef< HTMLFormElement >( null );

	return (
		<Page
			showSidebarToggle={ false }
			hasPadding
			{ ...pageProps }
			actions={
				<SaveButton
					form={ formId }
					size="compact"
					hasChanges={ isDirty }
					isSaving={ isSaving }
				/>
			}
		>
			<form
				id={ formId }
				ref={ formRef }
				onSubmit={ ( event ) => {
					event.preventDefault();
					if ( isDirty && ! isSaving ) {
						save();
					}
				} }
			>
				<SettingsContent>
					<SaveFailedNotice
						hasFailed={ hasFailed }
						onRetry={ () => formRef.current?.requestSubmit() }
					/>
					{ children( { data, onChange } ) }
				</SettingsContent>
			</form>
			<UnsavedChangesGuard isDirty={ isDirty } />
		</Page>
	);
}

/**
 * Constrains settings content to a readable width. Forms stay narrow so
 * fields don't stretch; tables need room for their columns, so they can
 * be wide.
 */
export function SettingsContent( {
	wide = false,
	children,
}: {
	wide?: boolean;
	children: ReactNode;
} ) {
	return (
		<Stack
			direction="column"
			gap="xl"
			className={ clsx( styles.content, wide && styles[ 'is-wide' ] ) }
		>
			{ children }
		</Stack>
	);
}

/**
 * A group of related settings in a card. Its title is an `h2`, or an `h3`
 * when the card sits inside a `SettingsGroup`.
 */
export function SettingsSection( {
	title,
	titleId,
	headingLevel = 2,
	description,
	children,
}: {
	title: string;
	titleId?: string;
	headingLevel?: 2 | 3;
	description?: string;
	children: ReactNode;
} ) {
	const Heading = headingLevel === 3 ? 'h3' : 'h2';
	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="column" gap="xs">
					<Card.Title id={ titleId } render={ <Heading /> }>
						{ title }
					</Card.Title>
					{ description && (
						<Text
							variant="body-md"
							className={ styles.description }
						>
							{ description }
						</Text>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>{ children }</Card.Content>
		</Card.Root>
	);
}

/**
 * A section of a page that holds several cards, with an `h2` heading on the
 * canvas. The cards inside it take `h3` titles.
 */
export function SettingsGroup( {
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
} ) {
	return (
		<Stack direction="column" gap="lg">
			<Stack direction="column" gap="xs">
				<Text variant="heading-lg" render={ <h2 /> }>
					{ title }
				</Text>
				{ description && (
					<Text variant="body-md" className={ styles.description }>
						{ description }
					</Text>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}

/**
 * A `DataForm` with the regular layout, bound to a manual-save draft.
 */
export function SettingsForm< T extends object >( {
	data,
	fields,
	onChange,
}: {
	data: T;
	fields: Field< T >[];
	onChange: ( edits: Partial< T > ) => void;
} ) {
	const form = {
		layout: { type: 'regular' as const },
		fields: fields.map( ( field ) => field.id ),
	};
	const { validity } = useFormValidity( data, fields, form );
	return (
		<DataForm< T >
			data={ data }
			fields={ fields }
			form={ form }
			validity={ validity }
			onChange={ ( edits ) => onChange( edits as Partial< T > ) }
		/>
	);
}

export type GeneralSettings = {
	storeName: string;
	tagline: string;
	contactEmail: string;
	country: string;
	guestCheckout: boolean;
	orderNotes: boolean;
	orderPrefix: string;
};

export const generalSettings: GeneralSettings = {
	storeName: 'Pizza Planet',
	tagline: 'Out of this world pizza.',
	contactEmail: 'hello@example.com',
	country: 'us',
	guestCheckout: true,
	orderNotes: false,
	orderPrefix: 'PP-',
};

export const generalFields: Field< GeneralSettings >[] = [
	{ id: 'storeName', label: 'Store name', type: 'text' },
	{
		id: 'tagline',
		label: 'Tagline',
		type: 'text',
		description: 'A short description shown in search results.',
	},
	{ id: 'contactEmail', label: 'Contact email', type: 'email' },
	{
		id: 'country',
		label: 'Country',
		type: 'text',
		elements: [
			{ value: 'us', label: 'United States' },
			{ value: 'gb', label: 'United Kingdom' },
			{ value: 'de', label: 'Germany' },
			{ value: 'jp', label: 'Japan' },
		],
	},
];

export const checkoutFields: Field< GeneralSettings >[] = [
	{
		id: 'guestCheckout',
		label: 'Allow guest checkout',
		type: 'boolean',
		Edit: 'checkbox',
	},
	{
		id: 'orderNotes',
		label: 'Show order notes field',
		type: 'boolean',
		Edit: 'checkbox',
	},
	{
		id: 'orderPrefix',
		label: 'Order number prefix',
		type: 'text',
	},
];

export type PaymentSettings = {
	currency: string;
	testMode: boolean;
	statementDescriptor: string;
};

export const paymentSettings: PaymentSettings = {
	currency: 'usd',
	testMode: true,
	statementDescriptor: 'PIZZA PLANET',
};

export const paymentFields: Field< PaymentSettings >[] = [
	{
		id: 'currency',
		label: 'Currency',
		type: 'text',
		elements: [
			{ value: 'usd', label: 'US dollar' },
			{ value: 'gbp', label: 'Pound sterling' },
			{ value: 'eur', label: 'Euro' },
			{ value: 'jpy', label: 'Japanese yen' },
		],
	},
	{
		id: 'testMode',
		label: 'Use test mode',
		type: 'boolean',
		Edit: 'checkbox',
		description: 'Process payments without charging customers.',
	},
	{
		id: 'statementDescriptor',
		label: 'Statement descriptor',
		type: 'text',
		description: 'Shown on customers’ bank statements.',
	},
];

export type PaymentsAndPayoutsSettings = PaymentSettings & {
	payoutSchedule: string;
	minimumPayout: string;
	notifyPayoutSent: boolean;
	notifyPayoutFailed: boolean;
};

export const paymentsAndPayoutsSettings: PaymentsAndPayoutsSettings = {
	...paymentSettings,
	payoutSchedule: 'weekly',
	minimumPayout: '50',
	notifyPayoutSent: true,
	notifyPayoutFailed: true,
};

export const paymentOptionFields: Field< PaymentsAndPayoutsSettings >[] = [
	{
		id: 'currency',
		label: 'Currency',
		type: 'text',
		elements: [
			{ value: 'usd', label: 'US dollar' },
			{ value: 'gbp', label: 'Pound sterling' },
			{ value: 'eur', label: 'Euro' },
			{ value: 'jpy', label: 'Japanese yen' },
		],
	},
	{
		id: 'testMode',
		label: 'Use test mode',
		type: 'boolean',
		Edit: 'checkbox',
		description: 'Process payments without charging customers.',
	},
];

export const bankStatementFields: Field< PaymentsAndPayoutsSettings >[] = [
	{
		id: 'statementDescriptor',
		label: 'Statement descriptor',
		type: 'text',
		description: 'Shown on customers’ bank statements.',
	},
];

export const payoutScheduleFields: Field< PaymentsAndPayoutsSettings >[] = [
	{
		id: 'payoutSchedule',
		label: 'Pay out',
		type: 'text',
		Edit: 'radio',
		elements: [
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' },
			{ value: 'monthly', label: 'Monthly' },
		],
	},
	{
		id: 'minimumPayout',
		label: 'Minimum payout amount',
		type: 'text',
		description: 'Balances below this amount roll over to the next payout.',
	},
];

export const payoutNotificationFields: Field< PaymentsAndPayoutsSettings >[] = [
	{
		id: 'notifyPayoutSent',
		label: 'Email me when a payout is sent',
		type: 'boolean',
		Edit: 'checkbox',
	},
	{
		id: 'notifyPayoutFailed',
		label: 'Email me when a payout fails',
		type: 'boolean',
		Edit: 'checkbox',
	},
];

export type GatewaySettings = {
	apiKey: string;
	webhookSecret: string;
	captureMode: string;
};

export const GATEWAYS = [
	{ id: 'cards', name: 'Card payments' },
	{ id: 'wallets', name: 'Digital wallets' },
	{ id: 'pay-later', name: 'Buy now, pay later' },
];

export const gatewaySettings: Record< string, GatewaySettings > = {
	cards: {
		apiKey: 'pk_test_4eC39HqLyjWDarjtT1zdp7dc',
		webhookSecret: '',
		captureMode: 'automatic',
	},
	wallets: {
		apiKey: 'pk_live_9fB27KdMwqZrLpX4',
		webhookSecret: 'whsec_51Hq',
		captureMode: 'automatic',
	},
	'pay-later': { apiKey: '', webhookSecret: '', captureMode: 'manual' },
};

export function gatewayStatus( { apiKey }: GatewaySettings ): SubpageStatus {
	if ( ! apiKey ) {
		return { label: 'Not connected', intent: 'none' };
	}
	return apiKey.startsWith( 'pk_test_' )
		? { label: 'Test API key', intent: 'informational' }
		: { label: 'Connected', intent: 'stable' };
}

export const gatewayFields: Field< GatewaySettings >[] = [
	{ id: 'apiKey', label: 'API key', type: 'text' },
	{ id: 'webhookSecret', label: 'Webhook secret', type: 'password' },
	{
		id: 'captureMode',
		label: 'Capture payments',
		type: 'text',
		Edit: 'radio',
		elements: [
			{ value: 'automatic', label: 'Automatically' },
			{ value: 'manual', label: 'Manually, after review' },
		],
	},
];

export type EmailSettings = {
	senderName: string;
	senderEmail: string;
	footerText: string;
};

export const emailSettings: EmailSettings = {
	senderName: 'Pizza Planet',
	senderEmail: 'orders@example.com',
	footerText: 'Thanks for ordering from Pizza Planet.',
};

export const emailFields: Field< EmailSettings >[] = [
	{ id: 'senderName', label: 'Sender name', type: 'text' },
	{ id: 'senderEmail', label: 'Sender email', type: 'email' },
	{
		id: 'footerText',
		label: 'Footer text',
		type: 'text',
		Edit: 'textarea',
	},
];
