/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { download, upload } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { Guidelines } from '../../store/constants';

interface ImportExportControlsProps {
	guidelines: Guidelines | null;
	onImport: ( data: Partial< Guidelines > ) => void;
}

export default function ImportExportControls( {
	guidelines,
	onImport,
}: ImportExportControlsProps ) {
	const [ importError, setImportError ] = useState< string | null >( null );
	const [ importSuccess, setImportSuccess ] = useState( false );
	const fileInputRef = useRef< HTMLInputElement >( null );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleExport = () => {
		if ( ! guidelines ) {
			return;
		}

		const exportData = {
			__file: 'wp_guidelines',
			version: 1,
			exported_at: new Date().toISOString(),
			status: guidelines.status,
			guideline_categories: guidelines.guideline_categories,
		};

		const blob = new window.Blob(
			[ JSON.stringify( exportData, null, 2 ) ],
			{
				type: 'application/json',
			}
		);

		const url = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );
		link.href = url;
		link.download = `guidelines-${
			new Date().toISOString().split( 'T' )[ 0 ]
		}.json`;
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		URL.revokeObjectURL( url );

		createSuccessNotice( __( 'Guidelines exported successfully.' ), {
			type: 'snackbar',
		} );
	};

	const handleFileSelect = (
		event: React.ChangeEvent< HTMLInputElement >
	) => {
		const file = event.target.files?.[ 0 ];
		if ( ! file ) {
			return;
		}

		setImportError( null );
		setImportSuccess( false );

		const reader = new window.FileReader();

		reader.onload = ( e ) => {
			try {
				const data = JSON.parse( e.target?.result as string );

				// Validate file type
				if ( data.__file !== 'wp_guidelines' ) {
					throw new Error(
						__( 'Invalid file: not a guidelines JSON file.' )
					);
				}

				// Validate structure
				if (
					! data.guideline_categories ||
					typeof data.guideline_categories !== 'object'
				) {
					throw new Error(
						__( 'Invalid file: missing guideline_categories.' )
					);
				}

				onImport( {
					status: data.status || 'draft',
					guideline_categories: data.guideline_categories,
				} );

				setImportSuccess( true );
			} catch ( err ) {
				setImportError(
					( err as Error ).message ||
						__( 'Failed to parse JSON file.' )
				);
			}
		};

		reader.onerror = () => {
			setImportError( __( 'Failed to read file.' ) );
		};

		reader.readAsText( file );
		event.target.value = '';
	};

	return (
		<div className="content-guidelines-import-export">
			<VStack spacing={ 3 }>
				<Text weight="600">{ __( 'Export / Import' ) }</Text>
				<Text variant="muted">
					{ __(
						'Export your guidelines as JSON or import from a file.'
					) }
				</Text>

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

				<Spacer margin={ 1 } />

				<input
					ref={ fileInputRef }
					type="file"
					accept=".json,application/json"
					onChange={ handleFileSelect }
					style={ { display: 'none' } }
				/>

				<HStack spacing={ 3 } wrap>
					<Button
						variant="secondary"
						icon={ download }
						onClick={ handleExport }
						disabled={ ! guidelines }
						__next40pxDefaultSize
						accessibleWhenDisabled
					>
						{ __( 'Export' ) }
					</Button>
					<Button
						variant="secondary"
						icon={ upload }
						onClick={ () => fileInputRef.current?.click() }
						__next40pxDefaultSize
					>
						{ __( 'Import' ) }
					</Button>
				</HStack>
			</VStack>
		</div>
	);
}
