/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { download, upload } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import './style.scss';

/**
 * Import/Export panel component.
 *
 * @return {JSX.Element} Import/Export panel.
 */
export default function ImportExportPanel() {
	const [ importError, setImportError ] = useState( null );
	const [ importSuccess, setImportSuccess ] = useState( false );
	const fileInputRef = useRef( null );

	const { active, draft } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			active: store.getActive(),
			draft: store.getDraft(),
		};
	}, [] );

	const { setDraft } = useDispatch( STORE_NAME );

	/**
	 * Export guidelines as JSON file.
	 */
	const handleExport = () => {
		const guidelines = draft || active;

		if ( ! guidelines ) {
			return;
		}

		const exportData = {
			version: 1,
			exported_at: new Date().toISOString(),
			guidelines,
		};

		const blob = new Blob(
			[ JSON.stringify( exportData, null, 2 ) ],
			{ type: 'application/json' }
		);

		const url = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );
		link.href = url;
		link.download = `content-guidelines-${ new Date().toISOString().split( 'T' )[ 0 ] }.json`;
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		URL.revokeObjectURL( url );
	};

	/**
	 * Handle file selection for import.
	 *
	 * @param {Event} event The file input change event.
	 */
	const handleFileSelect = ( event ) => {
		const file = event.target.files?.[ 0 ];

		if ( ! file ) {
			return;
		}

		setImportError( null );
		setImportSuccess( false );

		const reader = new FileReader();

		reader.onload = ( e ) => {
			try {
				const data = JSON.parse( e.target.result );

				// Validate the import data
				if ( ! data.guidelines ) {
					throw new Error( __( 'Invalid file: missing guidelines data.', 'content-guidelines' ) );
				}

				// Basic schema validation
				const guidelines = data.guidelines;
				if ( typeof guidelines !== 'object' ) {
					throw new Error( __( 'Invalid file: guidelines must be an object.', 'content-guidelines' ) );
				}

				// Import as draft
				setDraft( guidelines );
				setImportSuccess( true );
			} catch ( err ) {
				setImportError( err.message || __( 'Failed to parse JSON file.', 'content-guidelines' ) );
			}
		};

		reader.onerror = () => {
			setImportError( __( 'Failed to read file.', 'content-guidelines' ) );
		};

		reader.readAsText( file );

		// Reset the input so the same file can be selected again
		event.target.value = '';
	};

	/**
	 * Trigger file input click.
	 */
	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const hasGuidelines = active || draft;

	return (
		<div className="import-export-panel">
			<VStack spacing={ 6 }>
				<div>
					<Heading level={ 2 } className="import-export-panel__title">
						{ __( 'Import / Export', 'content-guidelines' ) }
					</Heading>
					<Spacer margin={ 2 } />
					<Text variant="muted">
						{ __( 'Transfer guidelines between sites or create backups.', 'content-guidelines' ) }
					</Text>
				</div>

				{ importError && (
					<Notice
						status="error"
						isDismissible
						onDismiss={ () => setImportError( null ) }
					>
						{ importError }
					</Notice>
				) }

				{ importSuccess && (
					<Notice
						status="success"
						isDismissible
						onDismiss={ () => setImportSuccess( false ) }
					>
						{ __( 'Guidelines imported as draft. Review and publish when ready.', 'content-guidelines' ) }
					</Notice>
				) }

				<VStack spacing={ 4 }>
					<div className="import-export-panel__section">
						<Heading level={ 3 } className="import-export-panel__section-title">
							{ __( 'Export', 'content-guidelines' ) }
						</Heading>
						<Text variant="muted" className="import-export-panel__section-desc">
							{ __( 'Download your current guidelines as a JSON file.', 'content-guidelines' ) }
						</Text>
						<Spacer margin={ 3 } />
						<Button
							variant="secondary"
							icon={ download }
							onClick={ handleExport }
							disabled={ ! hasGuidelines }
						>
							{ __( 'Export JSON', 'content-guidelines' ) }
						</Button>
					</div>

					<div className="import-export-panel__section">
						<Heading level={ 3 } className="import-export-panel__section-title">
							{ __( 'Import', 'content-guidelines' ) }
						</Heading>
						<Text variant="muted" className="import-export-panel__section-desc">
							{ __( 'Load guidelines from a JSON file. Imported data will be saved as a draft.', 'content-guidelines' ) }
						</Text>
						<Spacer margin={ 3 } />
						<input
							ref={ fileInputRef }
							type="file"
							accept=".json,application/json"
							onChange={ handleFileSelect }
							style={ { display: 'none' } }
						/>
						<Button
							variant="secondary"
							icon={ upload }
							onClick={ handleImportClick }
						>
							{ __( 'Import JSON', 'content-guidelines' ) }
						</Button>
					</div>
				</VStack>
			</VStack>
		</div>
	);
}
