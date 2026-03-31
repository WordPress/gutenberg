/* @jsxRuntime automatic */

/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	Modal,
	Notice,
	useNavigator,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { importContentGuidelines, exportContentGuidelines } from '../api';
import ActionItem from './action-item';

function getErrorMessage( error: unknown ): string {
	if ( error instanceof Error ) {
		return error.message;
	}

	if ( typeof error === 'object' && error !== null && 'message' in error ) {
		return String( ( error as { message: unknown } ).message );
	}
	return __( 'Unknown error.' );
}

export default function ActionsSection() {
	const { goTo } = useNavigator();

	const fileInputRef = useRef< HTMLInputElement >( null );
	const [ isImporting, setIsImporting ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ pendingImport, setPendingImport ] = useState< File | null >( null );

	function handleImportClick() {
		fileInputRef.current?.click();
	}

	function handleFileChange( event: React.ChangeEvent< HTMLInputElement > ) {
		const file = event.target.files?.[ 0 ];
		event.target.value = ''; // allow re-selecting the same file
		if ( ! file ) {
			return;
		}
		setPendingImport( file );
	}

	async function handleModalContinue() {
		if ( ! pendingImport ) {
			return;
		}
		const file = pendingImport;
		setPendingImport( null );
		setIsImporting( true );
		try {
			await importContentGuidelines( file );
			setError( null );
		} catch ( importError ) {
			setError(
				sprintf(
					/* translators: %s: Error message. */
					__( 'We ran into a problem importing your guidelines. %s' ),
					getErrorMessage( importError )
				)
			);
		} finally {
			setIsImporting( false );
		}
	}

	async function handleExportClick() {
		try {
			exportContentGuidelines();
			setError( null );
		} catch ( exportError ) {
			setError(
				sprintf(
					/* translators: %s: Error message. */
					__( 'We ran into a problem exporting your guidelines: %s' ),
					getErrorMessage( exportError )
				)
			);
		}
	}

	const ACTIONS = [
		{
			slug: 'import',
			title: __( 'Import' ),
			description: __( 'Upload a JSON file to import your guidelines.' ),
			buttonLabel: __( 'Upload' ),
			ariaLabel: __( 'Import guidelines' ),
			onClick: handleImportClick,
			isBusy: isImporting,
			disabled: isImporting || !! pendingImport,
		},
		{
			slug: 'export',
			title: __( 'Export' ),
			description: __( 'Export your guidelines to a JSON file.' ),
			buttonLabel: __( 'Download' ),
			ariaLabel: __( 'Export guidelines' ),
			onClick: handleExportClick,
		},
		{
			slug: 'revert',
			title: __( 'Revert' ),
			description: __( 'Use a previous version of your guidelines.' ),
			buttonLabel: __( 'View history' ),
			ariaLabel: __( 'View history of guidelines' ),
			onClick: () => goTo( '/revision-history' ),
		},
	];

	return (
		<VStack spacing={ 4 } className="content-guidelines__actions">
			<Heading level={ 3 } size={ 15 } weight={ 500 }>
				{ __( 'Actions' ) }
			</Heading>
			<input
				type="file"
				accept=".json"
				ref={ fileInputRef }
				onChange={ handleFileChange }
				style={ { display: 'none' } }
			/>
			{ error && (
				<Notice
					status="error"
					onRemove={ () => setError( null ) }
					isDismissible
				>
					{ error }
				</Notice>
			) }
			<Card className="content-guidelines__actions-card">
				{ /*
				 * Disable reason: The `list` ARIA role is redundant but
				 * Safari+VoiceOver won't announce the list otherwise.
				 */
				/* eslint-disable jsx-a11y/no-redundant-roles */ }
				<ul role="list" className="content-guidelines__actions-list">
					{ ACTIONS.map( ( action ) => (
						<ActionItem key={ action.slug } { ...action } />
					) ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Card>
			{ pendingImport && (
				<Modal
					title={ __( 'Import guidelines' ) }
					onRequestClose={ () => setPendingImport( null ) }
					size="medium"
				>
					<VStack spacing={ 4 }>
						<Text size={ 13 } weight={ 400 }>
							{ __(
								'Importing new guidelines will replace your current guidelines.'
							) }
						</Text>
						<Text size={ 13 } weight={ 400 }>
							{ __(
								'This can be undone from revision history.'
							) }
						</Text>
					</VStack>
					<HStack
						justify="flex-end"
						className="content-guidelines__import-modal-actions"
					>
						<Button
							variant="tertiary"
							onClick={ () => setPendingImport( null ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleModalContinue }
							__next40pxDefaultSize
						>
							{ __( 'Continue' ) }
						</Button>
					</HStack>
				</Modal>
			) }
		</VStack>
	);
}
