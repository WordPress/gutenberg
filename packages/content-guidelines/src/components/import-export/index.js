/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { download, upload } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useGuidelines } from '../../hooks';
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

	const { guidelines, edit } = useGuidelines();

	/**
	 * Export guidelines as JSON file.
	 */
	const handleExport = () => {
		if ( ! guidelines ) {
			return;
		}

		// Extract only the guideline sections, not the entity metadata
		const exportGuidelines = {
			brand_context: guidelines.brand_context || {},
			voice_tone: guidelines.voice_tone || {},
			copy_rules: guidelines.copy_rules || {},
			vocabulary: guidelines.vocabulary || {},
			heuristics: guidelines.heuristics || {},
			references: guidelines.references || {},
			images: guidelines.images || {},
			notes: guidelines.notes || '',
			blocks: guidelines.blocks || {},
		};

		const exportData = {
			version: 1,
			exported_at: new Date().toISOString(),
			guidelines: exportGuidelines,
		};

		const blob = new Blob( [ JSON.stringify( exportData, null, 2 ) ], {
			type: 'application/json',
		} );

		const url = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );
		link.href = url;
		link.download = `content-guidelines-${
			new Date().toISOString().split( 'T' )[ 0 ]
		}.json`;
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
					throw new Error(
						__( 'Invalid file: missing guidelines data.' )
					);
				}

				// Basic schema validation
				const importedData = data.guidelines;
				if ( typeof importedData !== 'object' ) {
					throw new Error(
						__( 'Invalid file: guidelines must be an object.' )
					);
				}

				// Import as edits - this will merge with core-data entity
				edit( importedData );
				setImportSuccess( true );
			} catch ( err ) {
				setImportError(
					err.message || __( 'Failed to parse JSON file.' )
				);
			}
		};

		reader.onerror = () => {
			setImportError( __( 'Failed to read file.' ) );
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

	const hasGuidelines = !! guidelines;

	return (
		<div className="content-guidelines-import-export">
			<VStack spacing={ 4 }>
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
						{ __(
							'Guidelines imported. Review and save when ready.'
						) }
					</Notice>
				) }

				<div className="content-guidelines-import-export__section">
					<Text weight="600">{ __( 'Export' ) }</Text>
					<Spacer margin={ 1 } />
					<Text variant="muted">
						{ __(
							'Download your current guidelines as a JSON file.'
						) }
					</Text>
					<Spacer margin={ 3 } />
					<Button
						variant="secondary"
						icon={ download }
						onClick={ handleExport }
						disabled={ ! hasGuidelines }
					>
						{ __( 'Export JSON' ) }
					</Button>
				</div>

				<div className="content-guidelines-import-export__section">
					<Text weight="600">{ __( 'Import' ) }</Text>
					<Spacer margin={ 1 } />
					<Text variant="muted">
						{ __(
							'Load guidelines from a JSON file. Imported data can be reviewed before saving.'
						) }
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
						{ __( 'Import JSON' ) }
					</Button>
				</div>
			</VStack>
		</div>
	);
}
