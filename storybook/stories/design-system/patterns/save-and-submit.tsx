import { SnackbarList } from '@wordpress/components';
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	AlertDialog,
	Button,
	Card,
	Notice,
	Stack,
	SwitchControl,
	Text,
	Tooltip,
} from '@wordpress/ui';
import styles from './save-and-submit.module.css';

const SAVE_DURATION = 1500;
const SAVED_MESSAGE = 'Changes saved';

const FEATURES = [
	{
		id: 'comments',
		label: 'Allow comments',
		description: 'Let visitors comment on new posts.',
	},
	{
		id: 'relatedPosts',
		label: 'Show related posts',
		description: 'Display links to similar posts below each post.',
	},
	{
		id: 'lazyLoading',
		label: 'Enable lazy loading',
		description: 'Load images only as visitors scroll to them.',
	},
] as const;

type FeatureId = ( typeof FEATURES )[ number ][ 'id' ];

type SiteSettings = { title: string; email: string };

const SITE_FIELDS: Field< SiteSettings >[] = [
	{
		id: 'title',
		label: 'Site title',
		type: 'text',
		isValid: { required: true },
	},
	{
		id: 'email',
		label: 'Administration email',
		type: 'email',
		isValid: { required: true },
	},
];

const SITE_FORM: Form = {
	layout: { type: 'regular' },
	fields: [ 'title', 'email' ],
};

function useSnackbar() {
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	const noticeIdRef = useRef( 0 );

	function show( content: string ) {
		noticeIdRef.current += 1;
		setNotices( [ { id: String( noticeIdRef.current ), content } ] );
	}

	function onRemove( id: string ) {
		setNotices( ( current ) =>
			current.filter( ( notice ) => notice.id !== id )
		);
	}

	return { notices, show, onRemove };
}

/**
 * Simulates a request that saves the given data after `SAVE_DURATION`.
 */
function useSimulatedSave< T >( onSaved: ( saved: T ) => void ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const timeoutRef = useRef< number >( undefined );

	useEffect( () => () => window.clearTimeout( timeoutRef.current ), [] );

	function save( data: T ) {
		setIsSaving( true );
		timeoutRef.current = window.setTimeout( () => {
			onSaved( data );
			setIsSaving( false );
		}, SAVE_DURATION );
	}

	return { isSaving, save };
}

function SaveChangesButton( {
	hasChanges,
	isSaving,
	onClick,
}: {
	hasChanges: boolean;
	isSaving: boolean;
	onClick: () => void;
} ) {
	return (
		<Stack>
			<Tooltip.Root disabled={ hasChanges }>
				<Tooltip.Trigger
					render={
						<Button
							disabled={ isSaving || ! hasChanges }
							loading={ isSaving }
							loadingAnnouncement="Saving changes"
							onClick={ onClick }
						>
							Save changes
						</Button>
					}
				/>
				<Tooltip.Popup>No unsaved changes</Tooltip.Popup>
			</Tooltip.Root>
		</Stack>
	);
}

function SnackbarArea( {
	snackbar,
}: {
	snackbar: ReturnType< typeof useSnackbar >;
} ) {
	return (
		<SnackbarList
			className={ styles.snackbars }
			notices={ snackbar.notices }
			onRemove={ snackbar.onRemove }
		/>
	);
}

/**
 * Saves a form behind an explicit "Save changes" button.
 *
 * The button is disabled while there is nothing to save, shows its loading
 * state while saving, and a `SnackbarList` confirms the save. `Snackbar`
 * announces the message politely, so the example does not add a second
 * live region.
 */
export function SaveFormLayoutCardExample() {
	const [ savedData, setSavedData ] = useState( { title: '' } );
	const [ data, setData ] = useState( savedData );
	const snackbar = useSnackbar();
	const { isSaving, save } = useSimulatedSave< typeof data >( ( saved ) => {
		setSavedData( saved );
		snackbar.show( SAVED_MESSAGE );
	} );
	const hasChanges = data.title !== savedData.title;

	return (
		<div className={ styles.container }>
			<Card.Root className={ styles.card }>
				<Card.Content>
					<Stack direction="column" gap="lg">
						<DataForm
							data={ data }
							fields={ [
								{
									id: 'title',
									label: 'Title',
									type: 'text',
								},
							] }
							form={ {
								layout: { type: 'regular' },
								fields: [ 'title' ],
							} }
							onChange={ ( edits ) =>
								setData( ( previous ) => ( {
									...previous,
									...edits,
								} ) )
							}
						/>
						<SaveChangesButton
							hasChanges={ hasChanges }
							isSaving={ isSaving }
							onClick={ () => save( data ) }
						/>
					</Stack>
				</Card.Content>
			</Card.Root>
			<SnackbarArea snackbar={ snackbar } />
		</div>
	);
}

/**
 * Validates the form when "Save changes" is clicked.
 *
 * The button stays enabled while fields are invalid. Clicking it runs the
 * form's native validation, which shows each error below its field and
 * moves focus to the first invalid one. The save only starts once every
 * field is valid.
 */
export function InvalidFieldsExample() {
	const [ savedData, setSavedData ] = useState< SiteSettings >( {
		title: 'Pizza Planet',
		email: 'hello@example.com',
	} );
	const [ data, setData ] = useState( savedData );
	const formRef = useRef< HTMLFormElement >( null );
	const snackbar = useSnackbar();
	const { validity } = useFormValidity( data, SITE_FIELDS, SITE_FORM );
	const { isSaving, save } = useSimulatedSave< typeof data >( ( saved ) => {
		setSavedData( saved );
		snackbar.show( SAVED_MESSAGE );
	} );
	const hasChanges =
		data.title !== savedData.title || data.email !== savedData.email;

	return (
		<div className={ styles.container }>
			<Card.Root className={ styles.card }>
				<Card.Content>
					<form
						ref={ formRef }
						onSubmit={ ( event ) => {
							event.preventDefault();
							save( data );
						} }
					>
						<Stack direction="column" gap="lg">
							<DataForm< SiteSettings >
								data={ data }
								fields={ SITE_FIELDS }
								form={ SITE_FORM }
								validity={ validity }
								onChange={ ( edits ) =>
									setData( ( previous ) => ( {
										...previous,
										...edits,
									} ) )
								}
							/>
							<SaveChangesButton
								hasChanges={ hasChanges }
								isSaving={ isSaving }
								onClick={ () =>
									formRef.current?.requestSubmit()
								}
							/>
						</Stack>
					</form>
				</Card.Content>
			</Card.Root>
			<SnackbarArea snackbar={ snackbar } />
		</div>
	);
}

/**
 * Saves each switch as soon as it is flipped.
 *
 * There is no Save button, and the switch itself shows the new state. When
 * `failingFeature` is set, saving that feature always fails: the switch
 * returns to its saved value and an error `Notice` below it offers a retry.
 * Each row's `Notice.List` stays mounted so the error is announced.
 */
export function AutosaveFeatureListExample( {
	failingFeature,
}: {
	failingFeature?: FeatureId;
} ) {
	const [ values, setValues ] = useState< Record< FeatureId, boolean > >( {
		comments: true,
		relatedPosts: false,
		lazyLoading: true,
	} );
	const [ failedValues, setFailedValues ] = useState<
		Partial< Record< FeatureId, boolean > >
	>( {} );
	const timeoutsRef = useRef< Partial< Record< FeatureId, number > > >( {} );

	useEffect( () => {
		const timeouts = timeoutsRef.current;
		return () => Object.values( timeouts ).forEach( clearTimeout );
	}, [] );

	function setFailedValue( id: FeatureId, value?: boolean ) {
		setFailedValues( ( current ) => ( { ...current, [ id ]: value } ) );
	}

	function onCheckedChange( id: FeatureId, checked: boolean ) {
		window.clearTimeout( timeoutsRef.current[ id ] );
		setFailedValue( id, undefined );
		setValues( ( current ) => ( { ...current, [ id ]: checked } ) );
		if ( id !== failingFeature ) {
			return;
		}
		timeoutsRef.current[ id ] = window.setTimeout( () => {
			setValues( ( current ) => ( { ...current, [ id ]: ! checked } ) );
			setFailedValue( id, checked );
		}, SAVE_DURATION );
	}

	return (
		<Card.Root className={ styles.card }>
			<Card.Header>
				<Card.Title>Features</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ FEATURES.map( ( feature ) => {
						const failedValue = failedValues[ feature.id ];
						return (
							<Stack
								key={ feature.id }
								direction="column"
								gap="sm"
							>
								<SwitchControl
									label={ feature.label }
									description={ feature.description }
									checked={ values[ feature.id ] }
									onCheckedChange={ ( checked ) =>
										onCheckedChange( feature.id, checked )
									}
								/>
								<Notice.List>
									{ failedValue !== undefined && (
										<Notice.Root intent="error">
											<Notice.Description>
												Couldn’t save this setting.
											</Notice.Description>
											<Notice.Actions>
												<Notice.ActionButton
													onClick={ () =>
														onCheckedChange(
															feature.id,
															failedValue
														)
													}
												>
													Try again
												</Notice.ActionButton>
											</Notice.Actions>
										</Notice.Root>
									) }
								</Notice.List>
							</Stack>
						);
					} ) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Asks for confirmation before leaving a form with unsaved changes.
 *
 * Leaving discards the edits and can't be undone, so the confirmation uses
 * the `irreversible` intent. With no unsaved changes, "Back" leaves
 * straight away.
 */
export function UnsavedChangesOnExitExample() {
	const [ savedData, setSavedData ] = useState( { title: 'Pizza Planet' } );
	const [ data, setData ] = useState( savedData );
	const [ hasLeft, setHasLeft ] = useState( false );
	const [ isConfirmOpen, setIsConfirmOpen ] = useState( false );
	const snackbar = useSnackbar();
	const { isSaving, save } = useSimulatedSave< typeof data >( ( saved ) => {
		setSavedData( saved );
		snackbar.show( SAVED_MESSAGE );
	} );
	const hasChanges = data.title !== savedData.title;

	function leave() {
		setData( savedData );
		setHasLeft( true );
	}

	if ( hasLeft ) {
		return (
			<div className={ styles.container }>
				<Stack direction="column" gap="md" align="start">
					<Text render={ <p /> }>You left the settings page.</Text>
					<Button
						variant="outline"
						onClick={ () => setHasLeft( false ) }
					>
						Return to settings
					</Button>
				</Stack>
			</div>
		);
	}

	return (
		<div className={ styles.container }>
			<Stack direction="column" gap="md">
				<Stack>
					<Button
						variant="minimal"
						tone="neutral"
						onClick={ () =>
							hasChanges ? setIsConfirmOpen( true ) : leave()
						}
					>
						Back
					</Button>
				</Stack>
				<Card.Root className={ styles.card }>
					<Card.Content>
						<Stack direction="column" gap="lg">
							<DataForm
								data={ data }
								fields={ [
									{
										id: 'title',
										label: 'Site title',
										type: 'text',
									},
								] }
								form={ {
									layout: { type: 'regular' },
									fields: [ 'title' ],
								} }
								onChange={ ( edits ) =>
									setData( ( previous ) => ( {
										...previous,
										...edits,
									} ) )
								}
							/>
							<SaveChangesButton
								hasChanges={ hasChanges }
								isSaving={ isSaving }
								onClick={ () => save( data ) }
							/>
						</Stack>
					</Card.Content>
				</Card.Root>
			</Stack>
			<AlertDialog.Root
				open={ isConfirmOpen }
				onOpenChange={ setIsConfirmOpen }
				onConfirm={ leave }
			>
				<AlertDialog.Popup
					intent="irreversible"
					title="Leave without saving?"
					description="Your changes will be lost."
					confirmButtonText="Leave without saving"
					cancelButtonText="Keep editing"
				/>
			</AlertDialog.Root>
			<SnackbarArea snackbar={ snackbar } />
		</div>
	);
}
