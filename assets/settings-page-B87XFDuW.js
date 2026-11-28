import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,r,u as i}from"./blocks-CABDfz-X.js";import{t as a}from"./jsx-runtime-BxZPLZy3.js";import{i as o,r as s}from"./react-sPqhvIIV.js";import{a as c,c as l,i as u,l as d,n as f,o as p,r as m,s as h,t as g,u as _}from"./settings-page.story-Bh_WN1W3.js";var v;function init_simple(){return(init_simple=e((()=>{v=`import { useState } from '@wordpress/element';
import { SettingsRouter } from './router';
import {
	checkoutFields,
	generalFields,
	generalSettings,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function SimpleSettingsPage() {
	const [ saved, setSaved ] = useState( generalSettings );

	return (
		<SettingsFormPage
			title="Settings"
			subTitle="Manage how your store looks and works."
			saved={ saved }
			onSave={ setSaved }
		>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection
						title="Store details"
						description="How your store is presented to customers."
					>
						<SettingsForm
							data={ data }
							fields={ generalFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					<SettingsSection title="Checkout">
						<SettingsForm
							data={ data }
							fields={ checkoutFields }
							onChange={ onChange }
						/>
					</SettingsSection>
				</>
			) }
		</SettingsFormPage>
	);
}

export function SimpleSettingsExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SimpleSettingsPage />
			</SettingsRouter>
		</SettingsExample>
	);
}
`})))()}var y;function init_sections(){return(init_sections=e((()=>{y=`import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { SettingsRouter } from './router';
import {
	bankStatementFields,
	paymentOptionFields,
	paymentsAndPayoutsSettings,
	payoutNotificationFields,
	payoutScheduleFields,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsGroup,
	SettingsSection,
} from './shared';

function SectionsPage() {
	const [ saved, setSaved ] = useState( paymentsAndPayoutsSettings );

	return (
		<SettingsFormPage
			title="Payments"
			subTitle="Manage how you take payments and receive payouts."
			saved={ saved }
			onSave={ setSaved }
		>
			{ ( { data, onChange } ) => (
				<Stack direction="column" gap="3xl">
					<SettingsGroup
						title="Accepting payments"
						description="How customers pay at checkout."
					>
						<SettingsSection
							title="Payment options"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ paymentOptionFields }
								onChange={ onChange }
							/>
						</SettingsSection>
						<SettingsSection
							title="Bank statements"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ bankStatementFields }
								onChange={ onChange }
							/>
						</SettingsSection>
					</SettingsGroup>
					<SettingsGroup
						title="Payouts"
						description="When you receive the money from your sales."
					>
						<SettingsSection title="Schedule" headingLevel={ 3 }>
							<SettingsForm
								data={ data }
								fields={ payoutScheduleFields }
								onChange={ onChange }
							/>
						</SettingsSection>
						<SettingsSection
							title="Notifications"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ payoutNotificationFields }
								onChange={ onChange }
							/>
						</SettingsSection>
					</SettingsGroup>
				</Stack>
			) }
		</SettingsFormPage>
	);
}

export function SectionsExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SectionsPage />
			</SettingsRouter>
		</SettingsExample>
	);
}
`})))()}var b;function init_failed_save(){return(init_failed_save=e((()=>{b=`import { useRef, useState } from '@wordpress/element';
import type { GeneralSettings } from './shared';
import { SettingsRouter } from './router';
import {
	checkoutFields,
	generalFields,
	generalSettings,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function FailedSavePage() {
	const [ saved, setSaved ] = useState( generalSettings );
	// The first save fails, so the example can show the retry.
	const hasFailedRef = useRef( false );

	const save = async ( data: GeneralSettings ) => {
		if ( ! hasFailedRef.current ) {
			hasFailedRef.current = true;
			throw new Error( 'The request failed.' );
		}
		setSaved( data );
	};

	return (
		<SettingsFormPage title="Settings" saved={ saved } onSave={ save }>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection
						title="Store details"
						description="How your store is presented to customers."
					>
						<SettingsForm
							data={ data }
							fields={ generalFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					<SettingsSection title="Checkout">
						<SettingsForm
							data={ data }
							fields={ checkoutFields }
							onChange={ onChange }
						/>
					</SettingsSection>
				</>
			) }
		</SettingsFormPage>
	);
}

/**
 * A page whose first save fails. The draft is kept, a notice at the top of
 * the form explains what happened, and "Try again" submits the form again.
 */
export function FailedSaveExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<FailedSavePage />
			</SettingsRouter>
		</SettingsExample>
	);
}
`;try{FailedSaveExample.__docgenInfo={description:`A page whose first save fails. The draft is kept, a notice at the top of
the form explains what happened, and "Try again" submits the form again.`,displayName:`FailedSaveExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/failed-save.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var x;function init_adjacent_pages(){return(init_adjacent_pages=e((()=>{x=`import { SettingsRouter, useSettingsPath } from './router';
import { SettingsExample } from './shared';
import {
	adjacentPageHeader,
	EmailsPage,
	GeneralPage,
	PaymentsPage,
	useStoreSettings,
} from './store-pages';

function AdjacentPagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const header = adjacentPageHeader( path );

	switch ( path ) {
		case '/payments':
			return (
				<PaymentsPage
					key={ path }
					settings={ settings }
					header={ header }
				/>
			);
		case '/emails':
			return (
				<EmailsPage
					key={ path }
					settings={ settings }
					header={ header }
				/>
			);
		default:
			return (
				<GeneralPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( '/general' ) }
				/>
			);
	}
}

/**
 * Peer sections of one settings area, switched with the \`Page\` navigation.
 * Each page keeps its own draft and Save.
 */
export function AdjacentPagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter initialPath="/general">
				<AdjacentPagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
`;try{AdjacentPagesExample.__docgenInfo={description:"Peer sections of one settings area, switched with the `Page` navigation.\nEach page keeps its own draft and Save.",displayName:`AdjacentPagesExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/adjacent-pages.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var S;function init_subpages(){return(init_subpages=e((()=>{S=`import { SettingsRouter, useSettingsPath } from './router';
import {
	generalFields,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';
import {
	GatewayPage,
	gatewayFromPath,
	GatewaysSection,
	subpageHeader,
	useStoreSettings,
} from './store-pages';

function SubpagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const gateway = gatewayFromPath( path );

	if ( gateway ) {
		return (
			<GatewayPage
				key={ path }
				gatewayId={ gateway.id }
				settings={ settings }
				header={ subpageHeader( [
					{ label: 'Settings', to: '/' },
					{ label: gateway.name },
				] ) }
			/>
		);
	}

	return (
		<SettingsFormPage
			key={ path }
			title="Settings"
			subTitle="Manage how your store looks and works."
			saved={ settings.general }
			onSave={ settings.setGeneral }
		>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection
						title="Store details"
						description="How your store is presented to customers."
					>
						<SettingsForm
							data={ data }
							fields={ generalFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					<GatewaysSection settings={ settings } />
				</>
			) }
		</SettingsFormPage>
	);
}

/**
 * A settings page with a subpage for detail that would crowd the main
 * page. The subpage replaces the title with breadcrumbs that lead back.
 */
export function SubpagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SubpagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
`;try{SubpagesExample.__docgenInfo={description:`A settings page with a subpage for detail that would crowd the main
page. The subpage replaces the title with breadcrumbs that lead back.`,displayName:`SubpagesExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/subpages.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var C;function init_adjacent_pages_and_subpages(){return(init_adjacent_pages_and_subpages=e((()=>{C=`import { SettingsRouter, useSettingsPath } from './router';
import { SettingsExample } from './shared';
import {
	adjacentPageHeader,
	EmailsPage,
	GatewayPage,
	gatewayFromPath,
	GeneralPage,
	PaymentsPage,
	SETTINGS_CRUMB,
	subpageHeader,
	useStoreSettings,
} from './store-pages';

function AdjacentPagesAndSubpagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const gateway = gatewayFromPath( path );

	if ( gateway ) {
		return (
			<GatewayPage
				key={ path }
				gatewayId={ gateway.id }
				settings={ settings }
				header={ subpageHeader( [
					SETTINGS_CRUMB,
					{ label: 'Payments', to: '/payments' },
					{ label: gateway.name },
				] ) }
			/>
		);
	}

	switch ( path ) {
		case '/payments':
			return (
				<PaymentsPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( path ) }
					showGateways
				/>
			);
		case '/emails':
			return (
				<EmailsPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( path ) }
				/>
			);
		default:
			return (
				<GeneralPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( '/general' ) }
				/>
			);
	}
}

/**
 * Adjacent pages where one page leads to a subpage. The subpage drops the
 * section navigation, and its breadcrumbs pass through the adjacent page it
 * belongs to.
 */
export function AdjacentPagesAndSubpagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter initialPath="/payments">
				<AdjacentPagesAndSubpagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
`;try{AdjacentPagesAndSubpagesExample.__docgenInfo={description:`Adjacent pages where one page leads to a subpage. The subpage drops the
section navigation, and its breadcrumbs pass through the adjacent page it
belongs to.`,displayName:`AdjacentPagesAndSubpagesExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/adjacent-pages-and-subpages.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var w;function init_records_subpage(){return(init_records_subpage=e((()=>{w=`import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import type { Action, View } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';
import { pencil } from '@wordpress/icons';
import { Link as RouterLink, useNavigate } from '@wordpress/route';
import type { ApiKey } from './api-keys';
import { defaultKeysView, KeyForm, KeysTable, useKeys } from './api-keys';
import { SettingsRouter, useSettingsPath } from './router';
import {
	SettingsContent,
	SettingsExample,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function KeysPage( {
	keys,
	view,
	onChangeView,
}: {
	keys: ApiKey[];
	view: View;
	onChangeView: ( view: View ) => void;
} ) {
	const navigate = useNavigate();
	const actions: Action< ApiKey >[] = [
		{
			id: 'edit',
			label: 'Edit',
			icon: pencil,
			isPrimary: true,
			callback: ( [ key ] ) => navigate( { to: \`/keys/\${ key.id }\` } ),
		},
	];

	return (
		<Page
			title="API keys"
			subTitle="Let apps and services connect to your site."
			showSidebarToggle={ false }
			hasPadding
		>
			<SettingsContent wide>
				<KeysTable
					keys={ keys }
					view={ view }
					onChangeView={ onChangeView }
					actions={ actions }
					renderItemLink={ ( { item, ...props } ) => (
						<RouterLink to={ \`/keys/\${ item.id }\` } { ...props } />
					) }
				/>
			</SettingsContent>
		</Page>
	);
}

function RecordsSubpageScreen() {
	const path = useSettingsPath();
	const { keys, saveKey } = useKeys();
	// Held above the routes, so returning from a record restores the
	// table's search, filters and page.
	const [ view, setView ] = useState< View >( defaultKeysView );
	const key = keys.find( ( { id } ) => path === \`/keys/\${ id }\` );

	if ( ! key ) {
		return (
			<KeysPage keys={ keys } view={ view } onChangeView={ setView } />
		);
	}

	return (
		<SettingsFormPage
			key={ path }
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: 'API keys', to: '/' },
						{ label: key.name },
					] }
				/>
			}
			ariaLabel={ key.name }
			saved={ key }
			onSave={ saveKey }
		>
			{ ( { data, onChange } ) => (
				<SettingsSection title="Key details">
					<KeyForm data={ data } onChange={ onChange } />
				</SettingsSection>
			) }
		</SettingsFormPage>
	);
}

/**
 * A table of records where each record opens its own subpage. The subpage
 * has room for a full editor and its Save sits in the \`Page\` header.
 */
export function RecordsSubpageExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<RecordsSubpageScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
`;try{RecordsSubpageExample.__docgenInfo={description:"A table of records where each record opens its own subpage. The subpage\nhas room for a full editor and its Save sits in the `Page` header.",displayName:`RecordsSubpageExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-subpage.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var T;function init_records_dialog(){return(init_records_dialog=e((()=>{T=`import type { Ref } from 'react';
import { Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { useRef } from '@wordpress/element';
import { pencil } from '@wordpress/icons';
import { Button, Dialog } from '@wordpress/ui';
import type { ApiKey } from './api-keys';
import {
	emptyKey,
	KeyForm,
	KeysTable,
	useKeyEditor,
	useKeys,
} from './api-keys';
import {
	SaveButton,
	SettingsContent,
	SettingsExample,
	useOverlayContainer,
} from './shared';
import styles from './style.module.css';
import { DiscardChangesDialog } from './unsaved-changes';

/**
 * Edits one record in a dialog. People leave through Cancel, which discards
 * the draft, or Save changes, which applies it; there is no close button and
 * clicking outside does nothing, so the choice is always explicit.
 */
export function KeyDialog( {
	editor,
}: {
	editor: ReturnType< typeof useKeyEditor >;
} ) {
	const overlayContainer = useOverlayContainer();
	// The alert dialog sits outside \`Dialog.Root\`: Base UI doesn't render a
	// backdrop for a dialog nested inside another, which would leave this
	// dialog undimmed behind it.
	return (
		<>
			<Dialog.Root
				open={ editor.isOpen }
				onOpenChange={ editor.onOpenChange }
				disablePointerDismissal
			>
				<Dialog.Popup
					portal={ <Dialog.Portal container={ overlayContainer } /> }
					finalFocus={ editor.finalFocus }
				>
					<Dialog.Header>
						<Dialog.Title>
							{ editor.isNew ? 'Add API key' : 'Edit API key' }
						</Dialog.Title>
					</Dialog.Header>
					<Dialog.Content>
						<form id={ editor.formId } onSubmit={ editor.onSubmit }>
							<KeyForm
								data={ editor.draft }
								onChange={ editor.onChange }
							/>
						</form>
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action
							variant="minimal"
							tone="neutral"
							disabled={ editor.isSaving }
						>
							Cancel
						</Dialog.Action>
						<KeySaveButton editor={ editor } />
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
			<DiscardChangesDialog
				open={ editor.discard.isConfirming }
				onKeepEditing={ editor.discard.keepEditing }
				onDiscard={ editor.discard.confirm }
			/>
		</>
	);
}

/**
 * Submits a record editor. A new record has nothing to compare against, so
 * its button stays enabled, and submitting an empty form explains what's
 * missing.
 */
export function KeySaveButton( {
	editor,
}: {
	editor: ReturnType< typeof useKeyEditor >;
} ) {
	return (
		<SaveButton
			form={ editor.formId }
			hasChanges={ editor.isNew || editor.isDirty }
			isSaving={ editor.isSaving }
		>
			{ editor.isNew ? 'Add API key' : 'Save changes' }
		</SaveButton>
	);
}

export function AddKeyButton( {
	onClick,
	buttonRef,
}: {
	onClick: () => void;
	buttonRef?: Ref< HTMLButtonElement >;
} ) {
	return (
		<Button
			ref={ buttonRef }
			size="compact"
			variant="solid"
			onClick={ onClick }
		>
			Add API key
		</Button>
	);
}

function RecordsDialogPage() {
	const { keys, saveKey } = useKeys();
	const pageRef = useRef< HTMLDivElement >( null );
	const addButtonRef = useRef< HTMLButtonElement >( null );
	const editor = useKeyEditor( saveKey, {
		scopeRef: pageRef,
		addButtonRef,
	} );
	const actions: Action< ApiKey >[] = [
		{
			id: 'edit',
			label: 'Edit',
			icon: pencil,
			isPrimary: true,
			callback: ( [ key ] ) => editor.open( key ),
		},
	];

	return (
		<div ref={ pageRef } className={ styles.screen }>
			<Page
				title="API keys"
				subTitle="Let apps and services connect to your site."
				showSidebarToggle={ false }
				hasPadding
				actions={
					<AddKeyButton
						buttonRef={ addButtonRef }
						onClick={ () => editor.open( emptyKey ) }
					/>
				}
			>
				<SettingsContent wide>
					<KeysTable
						keys={ keys }
						actions={ actions }
						onClickItem={ editor.open }
					/>
				</SettingsContent>
				<KeyDialog editor={ editor } />
			</Page>
		</div>
	);
}

/**
 * A table of records where each record opens a dialog. Use it for short
 * editors, when people should stay in the context of the table.
 */
export function RecordsDialogExample() {
	return (
		<SettingsExample>
			<RecordsDialogPage />
		</SettingsExample>
	);
}
`;try{KeyDialog.__docgenInfo={description:`Edits one record in a dialog. People leave through Cancel, which discards
the draft, or Save changes, which applies it; there is no close button and
clicking outside does nothing, so the choice is always explicit.`,displayName:`KeyDialog`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,methods:[],props:{editor:{defaultValue:null,declarations:[{fileName:`storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,name:`TypeLiteral`}],description:``,name:`editor`,required:!0,tags:{},type:{name:`{ record: ApiKey; isOpen: boolean; isNew: boolean; draft: ApiKey; onChange: (edits: Partial<ApiKey>) => void; isDirty: boolean; isSaving: boolean; formId: string; ... 6 more ...; finalFocus: () => true | HTMLElement; }`}}},tags:{}}}catch{}try{KeySaveButton.__docgenInfo={description:`Submits a record editor. A new record has nothing to compare against, so
its button stays enabled, and submitting an empty form explains what's
missing.`,displayName:`KeySaveButton`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,methods:[],props:{editor:{defaultValue:null,declarations:[{fileName:`storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,name:`TypeLiteral`}],description:``,name:`editor`,required:!0,tags:{},type:{name:`{ record: ApiKey; isOpen: boolean; isNew: boolean; draft: ApiKey; onChange: (edits: Partial<ApiKey>) => void; isDirty: boolean; isSaving: boolean; formId: string; ... 6 more ...; finalFocus: () => true | HTMLElement; }`}}},tags:{}}}catch{}try{AddKeyButton.__docgenInfo={description:``,displayName:`AddKeyButton`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,methods:[],props:{onClick:{defaultValue:null,declarations:[{fileName:`storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,name:`TypeLiteral`}],description:``,name:`onClick`,required:!0,tags:{},type:{name:`() => void`}},buttonRef:{defaultValue:null,declarations:[{fileName:`storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,name:`TypeLiteral`}],description:``,name:`buttonRef`,required:!1,tags:{},type:{name:`Ref<HTMLButtonElement>`}}},tags:{}}}catch{}try{RecordsDialogExample.__docgenInfo={description:`A table of records where each record opens a dialog. Use it for short
editors, when people should stay in the context of the table.`,displayName:`RecordsDialogExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-dialog.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var E;function init_records_drawer(){return(init_records_drawer=e((()=>{E=`import { Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { AlertDialog, Button, Drawer } from '@wordpress/ui';
import type { ApiKey } from './api-keys';
import {
	emptyKey,
	focusTargetAfterRemoval,
	KeyForm,
	KeysTable,
	useKeyEditor,
	useKeys,
} from './api-keys';
import { AddKeyButton, KeySaveButton } from './records-dialog';
import {
	SettingsContent,
	SettingsExample,
	simulateRequest,
	useNotify,
	useOverlayContainer,
} from './shared';
import styles from './style.module.css';
import { DiscardChangesDialog } from './unsaved-changes';

/**
 * Edits one record in a drawer, which keeps the table in view and leaves
 * room for secondary actions. Like the dialog, it closes only through its
 * footer actions. Revoking asks for confirmation first, because it cannot
 * be undone.
 */
function KeyDrawer( {
	editor,
	onRevoke,
	pageRef,
	addButtonRef,
}: {
	editor: ReturnType< typeof useKeyEditor >;
	onRevoke: ( key: ApiKey ) => void;
	pageRef: { current: HTMLElement | null };
	addButtonRef: { current: HTMLElement | null };
} ) {
	const [ isConfirmingRevoke, setIsConfirmingRevoke ] = useState( false );
	const revokeButtonRef = useRef< HTMLButtonElement >( null );
	// Set only for a revoke that succeeded, so canceling still returns to
	// Revoke while closing the drawer focuses whatever remains.
	const revokedFocusRef = useRef< HTMLElement | null >( null );
	const notify = useNotify();
	const overlayContainer = useOverlayContainer();

	const revokeKey = async () => {
		await simulateRequest();
		const target = focusTargetAfterRemoval(
			editor.record.id,
			pageRef.current,
			addButtonRef.current
		);
		// Read by the dialog and drawer as they close. Cleared afterwards so
		// a later close returns focus normally.
		revokedFocusRef.current = target;
		onRevoke( editor.record );
		editor.close();
		notify( 'API key revoked.' );
		// Both overlays restore focus while closing, and the record they
		// opened from is gone by then. Place focus once that has settled,
		// then drop the target so the next close behaves normally.
		window.setTimeout( () => target?.focus(), 50 );
		window.setTimeout( () => {
			revokedFocusRef.current = null;
		}, 300 );
	};

	// The alert dialogs sit outside \`Drawer.Root\`: Base UI doesn't render a
	// backdrop for a dialog nested inside another, which would leave the
	// drawer undimmed behind them.
	return (
		<>
			<Drawer.Root
				swipeDirection={ isRTL() ? 'left' : 'right' }
				open={ editor.isOpen }
				onOpenChange={ editor.onOpenChange }
				disablePointerDismissal
			>
				<Drawer.Popup
					portal={ <Drawer.Portal container={ overlayContainer } /> }
					finalFocus={ () =>
						revokedFocusRef.current ?? editor.finalFocus()
					}
				>
					<Drawer.Header>
						<Drawer.Title>
							{ editor.isNew ? 'Add API key' : 'Edit API key' }
						</Drawer.Title>
					</Drawer.Header>
					<Drawer.Content>
						<form id={ editor.formId } onSubmit={ editor.onSubmit }>
							<KeyForm
								data={ editor.draft }
								onChange={ editor.onChange }
							/>
						</form>
					</Drawer.Content>
					<Drawer.Footer>
						{ ! editor.isNew && (
							<Button
								ref={ revokeButtonRef }
								variant="minimal"
								tone="neutral"
								className={ styles[ 'footer-start' ] }
								disabled={ editor.isSaving }
								onClick={ () => setIsConfirmingRevoke( true ) }
							>
								Revoke
							</Button>
						) }
						<Drawer.Action
							variant="minimal"
							tone="neutral"
							disabled={ editor.isSaving }
						>
							Cancel
						</Drawer.Action>
						<KeySaveButton editor={ editor } />
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
			<AlertDialog.Root
				open={ isConfirmingRevoke }
				onOpenChange={ setIsConfirmingRevoke }
				onConfirm={ revokeKey }
			>
				<AlertDialog.Popup
					portal={
						<AlertDialog.Portal container={ overlayContainer } />
					}
					finalFocus={ () =>
						revokedFocusRef.current ?? revokeButtonRef.current
					}
					intent="irreversible"
					title={ \`Revoke “\${ editor.record.name }”?\` }
					description="Apps using this key will lose access immediately. This can’t be undone."
					confirmButtonText="Revoke key"
				/>
			</AlertDialog.Root>
			<DiscardChangesDialog
				open={ editor.discard.isConfirming }
				onKeepEditing={ editor.discard.keepEditing }
				onDiscard={ editor.discard.confirm }
			/>
		</>
	);
}

function RecordsDrawerPage() {
	const { keys, saveKey, revokeKey } = useKeys();
	const pageRef = useRef< HTMLDivElement >( null );
	const addButtonRef = useRef< HTMLButtonElement >( null );
	const editor = useKeyEditor( saveKey, {
		scopeRef: pageRef,
		addButtonRef,
	} );
	const actions: Action< ApiKey >[] = [
		{
			id: 'edit',
			label: 'Edit',
			icon: pencil,
			isPrimary: true,
			callback: ( [ key ] ) => editor.open( key ),
		},
	];

	return (
		<div ref={ pageRef } className={ styles.screen }>
			<Page
				title="API keys"
				subTitle="Let apps and services connect to your site."
				showSidebarToggle={ false }
				hasPadding
				actions={
					<AddKeyButton
						buttonRef={ addButtonRef }
						onClick={ () => editor.open( emptyKey ) }
					/>
				}
			>
				<SettingsContent wide>
					<KeysTable
						keys={ keys }
						actions={ actions }
						onClickItem={ editor.open }
					/>
				</SettingsContent>
				<KeyDrawer
					editor={ editor }
					onRevoke={ revokeKey }
					pageRef={ pageRef }
					addButtonRef={ addButtonRef }
				/>
			</Page>
		</div>
	);
}

/**
 * A table of records where each record opens a drawer, which holds the
 * editor and a destructive action that opens a confirmation dialog.
 */
export function RecordsDrawerExample() {
	return (
		<SettingsExample>
			<RecordsDrawerPage />
		</SettingsExample>
	);
}
`;try{RecordsDrawerExample.__docgenInfo={description:`A table of records where each record opens a drawer, which holds the
editor and a destructive action that opens a confirmation dialog.`,displayName:`RecordsDrawerExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/settings-page/records-drawer.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...o(),...e.components};return(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(i,{title:`Design System/Patterns/Settings Page`,tags:[`manifest`]}),`
`,(0,D.jsx)(t.h1,{id:`settings-page`,children:`Settings Page`}),`
`,(0,D.jsxs)(t.p,{children:[`Templates for settings screens, composed from the admin-ui `,(0,D.jsx)(t.code,{children:`Page`}),`, `,(0,D.jsx)(t.code,{children:`@wordpress/ui`}),` components, `,(0,D.jsx)(t.code,{children:`@wordpress/theme`}),` tokens and DataViews. Start from the template closest to your settings, then replace the fields.`]}),`
`,(0,D.jsx)(t.p,{children:`These templates are starting points, not requirements. Not every settings page needs to match one exactly: adapt the structure to what your settings need, and combine or depart from the templates where that serves people better.`}),`
`,(0,D.jsxs)(t.p,{children:[`Several of the `,(0,D.jsx)(t.code,{children:`@wordpress/ui`}),` components they use, including `,(0,D.jsx)(t.code,{children:`Button`}),`, `,(0,D.jsx)(t.code,{children:`Dialog`}),`, `,(0,D.jsx)(t.code,{children:`Drawer`}),` and `,(0,D.jsx)(t.code,{children:`AlertDialog`}),`, are still marked “Use with caution”, so their APIs may change. Treat the templates as the direction settings pages are heading, not as a recommendation to migrate existing screens yet.`]}),`
`,(0,D.jsx)(t.h2,{id:`building-blocks`,children:`Building blocks`}),`
`,(0,D.jsx)(t.p,{children:`Every template uses the same parts:`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`Page`})}),` from `,(0,D.jsx)(t.code,{children:`@wordpress/admin-ui`}),` provides the header: a title or breadcrumbs, optional section navigation, and the actions area where Save lives.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`Card`})}),` from `,(0,D.jsx)(t.code,{children:`@wordpress/ui`}),` groups related settings. Give each card a short title, and a description when the title alone doesn't say what the settings affect. The Structure section below covers when to use one. Cap form cards at `,(0,D.jsx)(t.code,{children:`--wpds-dimension-surface-width-xl`}),` so fields stay a readable length, and give tables of records `,(0,D.jsx)(t.code,{children:`--wpds-dimension-surface-width-2xl`}),` so their columns fit.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`DataForm`})}),` from `,(0,D.jsx)(t.code,{children:`@wordpress/dataviews`}),` renders the fields, so labels, descriptions, validation and spacing stay consistent.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`DataViews`})}),` from `,(0,D.jsx)(t.code,{children:`@wordpress/dataviews`}),` lists records people can add and edit.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`Dialog`})}),`, `,(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`Drawer`})}),` and `,(0,D.jsx)(t.strong,{children:(0,D.jsx)(t.code,{children:`AlertDialog`})}),` from `,(0,D.jsx)(t.code,{children:`@wordpress/ui`}),` hold record editors and confirmations.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Snackbars`}),` confirm saves that have no other visible effect. `,(0,D.jsx)(t.code,{children:`SnackbarList`}),` comes from `,(0,D.jsx)(t.code,{children:`@wordpress/components`}),`, since `,(0,D.jsx)(t.code,{children:`@wordpress/ui`}),` doesn't offer an equivalent yet.`]}),`
`]}),`
`,(0,D.jsxs)(t.p,{children:[`Each example's code shows its template. The helpers it imports, such as the manual-save draft, the sample fields and the in-canvas router, live alongside it in `,(0,D.jsx)(t.code,{children:`storybook/stories/design-system/patterns/settings-page/`}),`.`]}),`
`,(0,D.jsx)(t.h2,{id:`structure`,children:`Structure`}),`
`,(0,D.jsx)(t.p,{children:`Plan a settings page like a document's outline before choosing how it looks. The headings decide how assistive technology reads the page and lets people jump through it, and the same kind of content should get the same treatment wherever it appears.`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Put each group of related fields in a card.`}),` A card bounds a group and separates it from the groups around it. Keep the card even when a page has a single group, so every settings page reads the same way.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Title each card after its group of fields.`}),` The page title is the `,(0,D.jsx)(t.code,{children:`h1`}),`, and on a page without sections the card titles are `,(0,D.jsx)(t.code,{children:`h2`}),`s.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Add sections when cards form larger groups.`}),` A section heading sits on the canvas above its cards, as an `,(0,D.jsx)(t.code,{children:`h2`}),` with an optional description, and the cards inside it take `,(0,D.jsx)(t.code,{children:`h3`}),` titles. Use `,(0,D.jsx)(t.code,{children:`Text`}),` with `,(0,D.jsx)(t.code,{children:`variant="heading-lg"`}),` for the section heading. Each section gets its own heading, and a page with only a few cards needs none.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Don't skip heading levels`}),`, and don't choose a level for its size. The level follows the structure, so a card title looks the same whether it's an `,(0,D.jsx)(t.code,{children:`h2`}),` or an `,(0,D.jsx)(t.code,{children:`h3`}),`.`]}),`
`]}),`
`,(0,D.jsx)(t.h2,{id:`saving`,children:`Saving`}),`
`,(0,D.jsxs)(t.p,{children:[`These templates use the manual save model from `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-patterns-save-submit--docs`,children:`Save & Submit`}),`: edits are held in a draft until the user clicks “Save changes”. Manual save is the usual choice for settings, because their fields often depend on each other and should apply together. Autosave suits a page of independent preferences that each take effect on their own, such as the block editor’s Preferences modal. Choose one model for the whole page and don't mix the two: if you choose autosave, remove the Save button. `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-patterns-save-submit--docs#choose-one-save-model-per-surface`,children:`Choose one save model per surface`}),` explains how to decide.`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`One “Save changes” button per page`}),`, in the `,(0,D.jsx)(t.code,{children:`Page`}),` header actions. It covers every field on that page and nothing else.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Disabled only when there is nothing to save`}),`, and busy while saving. Don't explain the disabled state with a tooltip: tooltips aren't available to screen readers or on touch devices.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Invalid fields don't disable Save.`}),` The fields sit in a `,(0,D.jsx)(t.code,{children:`<form>`}),`, and Save submits it: invalid fields show their errors below them and the first one takes focus, and nothing is saved until they're fixed. The record editors work the same way.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Edits made while saving stay unsaved.`}),` People can keep typing while a save is in progress. Once it finishes, anything they changed in the meantime is still an unsaved change, and a record editor stays open to hold it.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Checkboxes, not switches, for on/off settings.`}),` A switch implies the change takes effect immediately, which isn't true until Save is clicked. Switches belong on autosave surfaces.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`A snackbar confirms the save.`}),` Errors belong next to the field, or in a `,(0,D.jsx)(t.code,{children:`Notice`}),` at the top of the form when a save fails or only partly succeeds.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Pages that only list records have no page-level Save.`}),` Each record editor saves on its own, and the header holds the action that adds a record.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Leaving with unsaved edits asks first.`}),` Switching pages, following a breadcrumb or closing a record editor with Escape asks “Discard unsaved changes?”, and reloading or closing the tab shows the browser’s own warning. Navigating while a save is in progress waits for it to finish, then asks only if something changed after clicking Save. Try it in any template by changing a field, then navigating away. See `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-patterns-save-submit--docs#unsaved-changes-on-exit`,children:`Unsaved changes on exit`}),`.`]}),`
`]}),`
`,(0,D.jsx)(t.h3,{id:`when-a-save-fails`,children:`When a save fails`}),`
`,(0,D.jsxs)(t.p,{children:[`Keep the draft, so nothing the user entered is lost, and explain the failure in a `,(0,D.jsx)(t.code,{children:`Notice`}),` at the top of the form with a “Try again” action. Retrying submits the form again, so validation runs first. A retry that goes through removes the notice, and the focused button with it, so move focus to “Save changes” first. In this example the first save fails: change a field, click “Save changes”, then try again.`]}),`
`,(0,D.jsx)(r,{of:m,source:{code:b,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`focus-after-navigation`,children:`Focus after navigation`}),`
`,(0,D.jsx)(t.p,{children:`Moving between adjacent pages and subpages replaces the page, including the link that was just used. Without help, keyboard focus falls back to the start of the document and screen readers don't announce the new page.`}),`
`,(0,D.jsxs)(t.p,{children:[`The templates' in-canvas router handles this: when a navigation removes the focused element, focus moves to the new page's `,(0,D.jsx)(t.code,{children:`Page`}),` region, and screen readers announce it by name. Try it by following a breadcrumb with the keyboard. `,(0,D.jsx)(t.code,{children:`@wordpress/boot`}),` currently updates and announces the route title, and will move focus the same way once `,(0,D.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/pull/86701`,rel:`nofollow`,children:`#86701`}),` lands. Until then, or if your app routes without `,(0,D.jsx)(t.code,{children:`@wordpress/boot`}),`, move focus to the `,(0,D.jsx)(t.code,{children:`Page`}),` region yourself after each navigation that loses focus.`]}),`
`,(0,D.jsxs)(t.p,{children:[`The region takes its name from `,(0,D.jsx)(t.code,{children:`title`}),`, so give it an `,(0,D.jsx)(t.code,{children:`ariaLabel`}),` whenever the title doesn't identify the page: on a subpage whose breadcrumbs replace the title, name it after the page, such as “Card payments”. On adjacent pages that share a title, name each one after its page, such as “Payments settings”.`]}),`
`,(0,D.jsx)(t.h2,{id:`simple-settings-page`,children:`Simple settings page`}),`
`,(0,D.jsx)(t.p,{children:`A single page with a few groups of settings. Use it when everything fits on one screen.`}),`
`,(0,D.jsx)(r,{of:l,source:{code:v,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`settings-page-with-sections`,children:`Settings page with sections`}),`
`,(0,D.jsxs)(t.p,{children:[`A longer page whose cards fall into larger groups, here "Accepting payments" and "Payouts". Each section has an `,(0,D.jsx)(t.code,{children:`h2`}),` heading on the canvas, and its cards take `,(0,D.jsx)(t.code,{children:`h3`}),` titles. Use it when one page holds several distinct areas, but they are too closely related, or too small, to split into adjacent pages.`]}),`
`,(0,D.jsx)(r,{of:h,source:{code:y,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`adjacent-pages`,children:`Adjacent pages`}),`
`,(0,D.jsxs)(t.p,{children:[`Peer sections of one settings area, such as General, Payments and Emails, switched with the `,(0,D.jsx)(t.code,{children:`Page`}),` `,(0,D.jsx)(t.code,{children:`navigation`}),`. Use it when the sections are independent and each one is substantial enough to deserve a page.`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Keep the page title the same across adjacent pages; the navigation shows which page is current, so the title doesn't need to name it.`}),`
`,(0,D.jsx)(t.li,{children:`Each page has its own draft and Save. Saving one page doesn't save another.`}),`
`,(0,D.jsxs)(t.li,{children:[`Pass a router link through `,(0,D.jsx)(t.code,{children:`components.link`}),`, so switching pages doesn't reload the screen.`]}),`
`]}),`
`,(0,D.jsx)(r,{of:g,source:{code:x,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`subpages`,children:`Subpages`}),`
`,(0,D.jsxs)(t.p,{children:[`A subpage holds detail that would crowd the main page, such as the credentials for each payment gateway. Open it from the page body with a full-width row at the bottom of the card: a `,(0,D.jsx)(t.code,{children:`Link`}),` with `,(0,D.jsx)(t.code,{children:`variant="unstyled"`}),`, styled as a row, with a trailing chevron to signal that it navigates. A status badge in the row tells people what they will find there.`]}),`
`,(0,D.jsx)(t.p,{children:`When a card leads to several subpages, put the rows in a list:`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsxs)(t.strong,{children:[`Use a `,(0,D.jsx)(t.code,{children:`ul`}),`, named by the card title.`]}),` Render the title as a heading, and point the list's `,(0,D.jsx)(t.code,{children:`aria-labelledby`}),` at it, so screen readers announce “Payment gateways, list, 3 items”.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsxs)(t.strong,{children:[`Keep `,(0,D.jsx)(t.code,{children:`role="list"`}),` on the unstyled list.`]}),` Safari drops list semantics when the bullets are removed.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Name each link after its destination.`}),` The row label matches the subpage's heading, so the link's name is just “Card payments”. Show the status in a `,(0,D.jsx)(t.code,{children:`Badge`}),` and connect it with `,(0,D.jsx)(t.code,{children:`aria-describedby`}),`, so screen readers announce it as a description rather than as part of the name.`]}),`
`]}),`
`,(0,D.jsxs)(t.p,{children:[`On the subpage, breadcrumbs replace the title and lead back to the parent page. Repeat the row's status next to the breadcrumbs with the `,(0,D.jsx)(t.code,{children:`Page`}),` `,(0,D.jsx)(t.code,{children:`badges`}),` prop, and update it from the saved settings, not the draft, so it changes when people click Save.`]}),`
`,(0,D.jsx)(r,{of:d,source:{code:S,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`adjacent-pages-and-subpages`,children:`Adjacent pages and subpages`}),`
`,(0,D.jsx)(t.p,{children:`When a subpage belongs to one of several adjacent pages, its trail passes through that page, for example "Settings / Payments / Card payments". "Payments" leads back to the page the subpage was opened from, with its navigation item current, and "Settings" leads to the first adjacent page. The subpage drops the section navigation.`}),`
`,(0,D.jsx)(r,{of:f,source:{code:C,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h2,{id:`records`,children:`Records`}),`
`,(0,D.jsxs)(t.p,{children:[`Some settings are lists of records, such as API keys, webhooks or redirects. These examples use API keys. Show them in a `,(0,D.jsx)(t.code,{children:`DataViews`}),` table, and choose how each record opens by the size of its editor.`]}),`
`,(0,D.jsx)(n,{children:`
| Editor | Use when |
| --- | --- |
| Subpage | The editor is long, has its own sections, or people need to link to a record. |
| Dialog | The editor is short and people should stay focused on one record. |
| Drawer | The editor is medium-sized, people benefit from seeing the table, or the record has secondary actions. |
`}),`
`,(0,D.jsx)(t.h3,{id:`records-that-open-a-subpage`,children:`Records that open a subpage`}),`
`,(0,D.jsxs)(t.p,{children:[`The record title links to the subpage, and the Edit action goes to the same place. The subpage uses breadcrumbs, and its Save sits in the `,(0,D.jsx)(t.code,{children:`Page`}),` header like any other settings page. The table goes away while a record is open, so keep its search, filters and page somewhere that outlives it, and people find their results as they left them when they come back. Real screens usually keep the view in the URL or in user preferences; this example holds it above its routes.`]}),`
`,(0,D.jsx)(r,{of:p,source:{code:w,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h3,{id:`records-that-open-a-dialog`,children:`Records that open a dialog`}),`
`,(0,D.jsx)(t.p,{children:`The dialog saves on its own. Cancel discards the draft, and Save applies it, closes the dialog and confirms with a snackbar. The same dialog adds new records.`}),`
`,(0,D.jsx)(t.p,{children:`The footer actions are the only way out: there is no close icon, and clicking outside does nothing, so people always choose between keeping and discarding their edits. Pressing Escape closes an untouched dialog, but asks first when there are unsaved edits.`}),`
`,(0,D.jsx)(r,{of:u,source:{code:T,language:`tsx`,type:`code`}}),`
`,(0,D.jsx)(t.h3,{id:`records-that-open-a-drawer`,children:`Records that open a drawer`}),`
`,(0,D.jsxs)(t.p,{children:[`The drawer works like the dialog, including closing only through its footer actions, with room for secondary actions. Revoking a key can't be undone, so it asks for confirmation in an `,(0,D.jsx)(t.code,{children:`AlertDialog`}),` with the `,(0,D.jsx)(t.code,{children:`irreversible`}),` intent, following `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-patterns-destructive-actions--docs`,children:`Destructive Actions`}),`. Canceling returns focus to Revoke. After the key is revoked, focus moves to the next record, or to the previous one when it was last, and to Add API key when none remain.`]}),`
`,(0,D.jsx)(r,{of:c,source:{code:E,language:`tsx`,type:`code`}})]})}function MDXContent(e={}){let{wrapper:t}={...o(),...e.components};return t?(0,D.jsx)(t,{...e,children:(0,D.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var D;function init_settings_page(){return(init_settings_page=e((()=>{D=a(),s(),t(),_(),init_simple(),init_sections(),init_failed_save(),init_adjacent_pages(),init_subpages(),init_adjacent_pages_and_subpages(),init_records_subpage(),init_records_dialog(),init_records_drawer()})))()}init_settings_page();export{MDXContent as default};