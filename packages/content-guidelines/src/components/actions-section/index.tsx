/**
 * WordPress dependencies
 */
import { useRef, useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	Button,
	Notice,
	FlexItem,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import {
	validateImportJson,
	mapImportToInternal,
	mapInternalToExport,
} from '../../utils/import-export';
import type { ExportSchema } from '../../utils/import-export';
import type { Guidelines } from '../../store/constants';

export default function ActionsSection() {
	const fileInputRef = useRef< HTMLInputElement >( null );
	const [ importError, setImportError ] = useState< string | null >( null );
	const { goTo } = useNavigator();

	const { guidelines } = useSelect( ( select ) => {
		const selectors = select( store );
		return {
			guidelines: selectors.getGuidelines(),
		};
	}, [] );

	const { saveGuidelines } = useDispatch( store );
	const { createSuccessNotice } = useDispatch( noticesStore );

	/**
	 * Handles the file input change event for importing guidelines.
	 */
	const handleImport = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const file = event.target.files?.[ 0 ];
			if ( ! file ) {
				return;
			}

			// Reset the input so the same file can be re-selected.
			event.target.value = '';

			const reader = new FileReader();

			reader.onload = async ( e ) => {
				try {
					const text = e.target?.result;
					if ( typeof text !== 'string' ) {
						setImportError(
							__( 'Could not read the selected file.' )
						);
						return;
					}

					let parsed: unknown;
					try {
						parsed = JSON.parse( text );
					} catch {
						setImportError(
							__( 'The selected file is not valid JSON.' )
						);
						return;
					}

					const validation = validateImportJson( parsed );
					if ( ! validation.valid ) {
						setImportError(
							validation.error ?? __( 'Invalid import file.' )
						);
						return;
					}

					const categories = mapImportToInternal(
						parsed as ExportSchema
					);

					// Build the full Guidelines object, preserving metadata
					// from existing guidelines or creating defaults.
					const updatedGuidelines: Guidelines = {
						id: guidelines?.id ?? 0,
						status: guidelines?.status ?? 'published',
						guideline_categories: categories,
						date: guidelines?.date,
						modified: new Date().toISOString(),
						author: guidelines?.author,
						author_name: guidelines?.author_name,
					};

					await saveGuidelines( updatedGuidelines );

					setImportError( null );
					createSuccessNotice(
						__( 'Content guidelines imported successfully.' ),
						{ type: 'snackbar' }
					);
				} catch {
					setImportError(
						__( 'An error occurred while importing guidelines.' )
					);
				}
			};

			reader.onerror = () => {
				setImportError( __( 'Could not read the selected file.' ) );
			};

			reader.readAsText( file );
		},
		[ guidelines, saveGuidelines, createSuccessNotice ]
	);

	/**
	 * Handles exporting guidelines as a JSON file download.
	 */
	const handleExport = useCallback( () => {
		if ( ! guidelines ) {
			return;
		}

		const exportData = mapInternalToExport(
			guidelines.guideline_categories
		);
		const json = JSON.stringify( exportData, null, 2 );
		const blob = new Blob( [ json ], { type: 'application/json' } );
		const url = URL.createObjectURL( blob );

		const date = new Date().toISOString().slice( 0, 10 );
		const filename = `content-guidelines-${ date }.json`;

		const link = document.createElement( 'a' );
		link.href = url;
		link.download = filename;
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		URL.revokeObjectURL( url );

		createSuccessNotice(
			__( 'Content guidelines exported successfully.' ),
			{ type: 'snackbar' }
		);
	}, [ guidelines, createSuccessNotice ] );

	return (
		<VStack spacing={ 4 }>
			<Heading level={ 2 } size={ 13 }>
				{ __( 'Actions' ) }
			</Heading>

			{ importError && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setImportError( null ) }
				>
					{ importError }
				</Notice>
			) }

			<input
				ref={ fileInputRef }
				type="file"
				accept=".json,application/json"
				style={ { display: 'none' } }
				onChange={ handleImport }
			/>

			<ItemGroup isBordered isSeparated>
				<Item>
					<HStack justify="space-between">
						<VStack spacing={ 1 }>
							<span>{ __( 'Import' ) }</span>
							<Text variant="muted">
								{ __(
									'Upload a JSON file to import your content guidelines'
								) }
							</Text>
						</VStack>
						<FlexItem>
							<Button
								variant="secondary"
								onClick={ () => fileInputRef.current?.click() }
								__next40pxDefaultSize
							>
								{ __( 'Upload' ) }
							</Button>
						</FlexItem>
					</HStack>
				</Item>

				<Item>
					<HStack justify="space-between">
						<VStack spacing={ 1 }>
							<span>{ __( 'Export' ) }</span>
							<Text variant="muted">
								{ __(
									'Export your content guidelines to a JSON file.'
								) }
							</Text>
						</VStack>
						<FlexItem>
							<Button
								variant="secondary"
								disabled={ ! guidelines }
								accessibleWhenDisabled
								onClick={ handleExport }
								__next40pxDefaultSize
							>
								{ __( 'Download' ) }
							</Button>
						</FlexItem>
					</HStack>
				</Item>

				<Item>
					<HStack justify="space-between">
						<VStack spacing={ 1 }>
							<span>{ __( 'Revert' ) }</span>
							<Text variant="muted">
								{ __(
									'Use a previous version of your content guidelines'
								) }
							</Text>
						</VStack>
						<FlexItem>
							<Button
								variant="secondary"
								onClick={ () => goTo( '/revisions' ) }
								__next40pxDefaultSize
							>
								{ __( 'View history' ) }
							</Button>
						</FlexItem>
					</HStack>
				</Item>
			</ItemGroup>
		</VStack>
	);
}
