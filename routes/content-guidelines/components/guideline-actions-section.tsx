/* @jsxRuntime automatic */

/**
 * WordPress dependencies
 */
import {
	Card,
	__experimentalConfirmDialog as ConfirmDialog,
	Notice,
	useNavigator,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './guideline-actions-section.scss';
import { importContentGuidelines, exportContentGuidelines } from '../api';
import ActionItem from './action-item';

function getErrorMessage( err: any ) {
	return err instanceof Error ? err.message : __( 'Unknown error' );
}

export default function GuidelineActionsSection() {
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
		} catch ( err ) {
			setError(
				sprintf(
					/* translators: %s: Error message. */
					__( 'We ran into a problem importing your guidelines: %s' ),
					getErrorMessage( err )
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
		} catch ( err ) {
			setError(
				sprintf(
					/* translators: %s: Error message. */
					__( 'We ran into a problem exporting your guidelines: %s' ),
					getErrorMessage( err )
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
						<li
							key={ action.slug }
							className="content-guidelines__action-list-item"
						>
							<ActionItem { ...action } />
						</li>
					) ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Card>

			<ConfirmDialog
				isOpen={ !! pendingImport }
				__experimentalHideHeader={ false }
				title={ __( 'Import guidelines' ) }
				confirmButtonText={ __( 'Continue' ) }
				onConfirm={ handleModalContinue }
				onCancel={ () => setPendingImport( null ) }
				size="small"
			>
				{ __(
					'Importing new guidelines will replace your current guidelines. This can be undone from revision history.'
				) }
			</ConfirmDialog>
		</VStack>
	);
}
