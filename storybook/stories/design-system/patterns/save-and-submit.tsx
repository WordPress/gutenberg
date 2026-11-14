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
	type = 'button',
}: {
	hasChanges: boolean;
	isSaving: boolean;
	onClick?: () => void;
	type?: 'button' | 'submit';
} ) {
	return (
		<Stack>
			<Button
				type={ type }
				disabled={ isSaving || ! hasChanges }
				loading={ isSaving }
				loadingAnnouncement="Saving changes"
				onClick={ onClick }
			>
				Save changes
			</Button>
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
 * The button stays enabled while fields are invalid. It submits the form,
 * as does pressing Enter in a field, which runs the form's native
 * validation: each error shows below its field and focus moves to the
 * first invalid one. The save only starts once every field is valid.
 *
 * A field shows its error as soon as focus leaves it, so the button sits
 * above the fields, where a new error can't push it away mid-click.
 */
export function InvalidFieldsExample() {
	const [ savedData, setSavedData ] = useState< SiteSettings >( {
		title: 'Pizza Planet',
		email: 'hello@example.com',
	} );
	const [ data, setData ] = useState( savedData );
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
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					if ( hasChanges && ! isSaving ) {
						save( data );
					}
				} }
			>
				<Card.Root className={ styles.card }>
					<Card.Header>
						<Stack
							direction="row"
							justify="space-between"
							align="center"
						>
							<Card.Title>Site</Card.Title>
							<SaveChangesButton
								type="submit"
								hasChanges={ hasChanges }
								isSaving={ isSaving }
							/>
						</Stack>
					</Card.Header>
					<Card.Content>
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
					</Card.Content>
				</Card.Root>
			</form>
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
	const savedValuesRef = useRef( values );
	const timeoutsRef = useRef< Partial< Record< FeatureId, number > > >( {} );
	const switchesRef = useRef<
		Partial< Record< FeatureId, HTMLSpanElement | null > >
	>( {} );

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
			savedValuesRef.current = {
				...savedValuesRef.current,
				[ id ]: checked,
			};
			return;
		}
		if ( checked === savedValuesRef.current[ id ] ) {
			return;
		}
		timeoutsRef.current[ id ] = window.setTimeout( () => {
			setValues( ( current ) => ( {
				...current,
				[ id ]: savedValuesRef.current[ id ],
			} ) );
			setFailedValue( id, checked );
		}, SAVE_DURATION );
	}

	// "Try again" is removed with its notice, so move focus to the switch
	// it retries rather than letting it fall back to the page.
	function retry( id: FeatureId, value: boolean ) {
		switchesRef.current[ id ]?.focus();
		onCheckedChange( id, value );
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
									ref={ ( element ) => {
										switchesRef.current[ feature.id ] =
											element;
									} }
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
														retry(
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
 * straight away, and during a save it waits for the save to finish first.
 * Reloading or closing the tab is guarded by the browser's own
 * `beforeunload` warning.
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
	const [ isLeavePending, setIsLeavePending ] = useState( false );
	const hasChanges = data.title !== savedData.title;
	const backRef = useRef< HTMLButtonElement >( null );
	const returnRef = useRef< HTMLButtonElement >( null );
	const previousHasLeftRef = useRef( hasLeft );

	// Leaving and returning each remove the button that was used, so move
	// focus to the main action of the view that replaces it.
	useEffect( () => {
		if ( previousHasLeftRef.current === hasLeft ) {
			return;
		}
		previousHasLeftRef.current = hasLeft;
		( hasLeft ? returnRef : backRef ).current?.focus();
	}, [ hasLeft ] );

	useEffect( () => {
		if ( hasLeft || ! hasChanges ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ hasLeft, hasChanges ] );

	useEffect( () => {
		if ( ! isLeavePending || isSaving ) {
			return;
		}
		setIsLeavePending( false );
		if ( hasChanges ) {
			setIsConfirmOpen( true );
		} else {
			setHasLeft( true );
		}
	}, [ isLeavePending, isSaving, hasChanges ] );

	function requestLeave() {
		if ( isSaving ) {
			setIsLeavePending( true );
		} else if ( hasChanges ) {
			setIsConfirmOpen( true );
		} else {
			leave();
		}
	}

	function leave() {
		setIsConfirmOpen( false );
		setHasLeft( true );
	}

	function returnToSettings() {
		setData( savedData );
		setHasLeft( false );
	}

	if ( hasLeft ) {
		return (
			<div className={ styles.container }>
				<Stack direction="column" gap="md" align="start">
					<Text render={ <p /> }>You left the settings page.</Text>
					<Button
						ref={ returnRef }
						variant="outline"
						onClick={ returnToSettings }
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
						ref={ backRef }
						variant="minimal"
						tone="neutral"
						loading={ isLeavePending }
						loadingAnnouncement="Saving changes"
						onClick={ requestLeave }
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
					title="Discard unsaved changes?"
					description="Your changes will be lost."
					confirmButtonText="Discard changes"
					cancelButtonText="Keep editing"
				/>
			</AlertDialog.Root>
			<SnackbarArea snackbar={ snackbar } />
		</div>
	);
}
