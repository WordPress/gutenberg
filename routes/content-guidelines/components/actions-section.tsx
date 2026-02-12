/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	Button,
	FlexItem,
	useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { GuidelineCategories } from '../types';
import { validateGuidelinesJson } from '../utils/import-export';

interface ActionsSectionProps {
	guidelines: GuidelineCategories | null;
	onImport: ( categories: GuidelineCategories ) => void;
}

export default function ActionsSection( {
	guidelines,
	onImport,
}: ActionsSectionProps ) {
	const fileInputRef = useRef< HTMLInputElement >( null );
	const { goTo } = useNavigator();
	const { createErrorNotice } = useDispatch( noticesStore );

	const handleImport = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const file = event.target.files?.[ 0 ];
			if ( ! file ) {
				return;
			}

			// Reset the input so the same file can be re-selected.
			event.target.value = '';

			const reader = new FileReader();

			reader.onload = ( e ) => {
				try {
					const text = e.target?.result;
					if ( typeof text !== 'string' ) {
						createErrorNotice(
							__( 'Could not read the selected file.' ),
							{ type: 'snackbar' }
						);
						return;
					}

					let parsed: unknown;
					try {
						parsed = JSON.parse( text );
					} catch {
						createErrorNotice(
							__( 'The selected file is not valid JSON.' ),
							{ type: 'snackbar' }
						);
						return;
					}

					const validation = validateGuidelinesJson( parsed );
					if ( ! validation.valid ) {
						createErrorNotice(
							validation.error ?? __( 'Invalid import file.' ),
							{ type: 'snackbar' }
						);
						return;
					}

					onImport( parsed as GuidelineCategories );
				} catch {
					createErrorNotice(
						__( 'An error occurred while importing guidelines.' ),
						{ type: 'snackbar' }
					);
				}
			};

			reader.onerror = () => {
				createErrorNotice( __( 'Could not read the selected file.' ), {
					type: 'snackbar',
				} );
			};

			reader.readAsText( file );
		},
		[ onImport, createErrorNotice ]
	);

	const handleExport = useCallback( () => {
		if ( ! guidelines ) {
			return;
		}

		const json = JSON.stringify( guidelines, null, 2 );
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
	}, [ guidelines ] );

	return (
		<VStack spacing={ 4 } className="content-guidelines__actions">
			<Heading level={ 2 } size={ 13 }>
				{ __( 'Actions' ) }
			</Heading>

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
								disabled={ ! guidelines }
								accessibleWhenDisabled
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
