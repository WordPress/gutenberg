/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import {
	Modal,
	Button,
	CheckboxControl,
	Spinner,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

const PLUGIN_SLUG = 'client-side-heic';
const PREFERENCE_SCOPE = 'core/media';
const PREFERENCE_KEY = 'dismissHeicPrompt';

/**
 * Modal component that prompts users to install the HEIC support plugin
 * when they attempt to upload HEIC/HEIF files.
 *
 * @param {Object}   props           Component props.
 * @param {File[]}   props.files     The HEIC files pending upload.
 * @param {Function} props.onRetry   Callback to retry the upload after plugin install.
 * @param {Function} props.onDismiss Callback when the prompt is dismissed.
 */
export default function HeicUploadPrompt( { files, onRetry, onDismiss } ) {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ dontAskAgain, setDontAskAgain ] = useState( false );
	const [ error, setError ] = useState( null );

	const { canInstallPlugins, isDismissed } = useSelect( ( select ) => {
		return {
			canInstallPlugins: select( coreStore ).canUser( 'create', {
				kind: 'root',
				name: 'plugin',
			} ),
			isDismissed: select( preferencesStore ).get(
				PREFERENCE_SCOPE,
				PREFERENCE_KEY
			),
		};
	}, [] );

	const { set: setPreference } = useDispatch( preferencesStore );
	const { createInfoNotice, createErrorNotice } =
		useDispatch( noticesStore );

	// If the user has previously dismissed the prompt, silently dismiss.
	if ( isDismissed ) {
		return null;
	}

	const fileCount = files?.length || 0;
	if ( fileCount === 0 ) {
		return null;
	}

	const handleInstall = async () => {
		setIsInstalling( true );
		setError( null );

		try {
			await apiFetch( {
				method: 'POST',
				path: '/wp/v2/plugins',
				data: { slug: PLUGIN_SLUG, status: 'active' },
			} );

			createInfoNotice(
				__( 'HEIC support plugin installed and activated.' ),
				{
					type: 'snackbar',
					speak: true,
					isDismissible: true,
				}
			);

			onRetry();
		} catch ( installError ) {
			const message =
				installError?.message ||
				__( 'Failed to install the HEIC support plugin.' );

			// Handle the case where the plugin is already installed but inactive.
			if ( installError?.code === 'folder_exists' ) {
				try {
					await apiFetch( {
						method: 'PUT',
						path: `/wp/v2/plugins/${ PLUGIN_SLUG }/${ PLUGIN_SLUG }`,
						data: { status: 'active' },
					} );

					createInfoNotice(
						__( 'HEIC support plugin activated.' ),
						{
							type: 'snackbar',
							speak: true,
							isDismissible: true,
						}
					);

					onRetry();
					return;
				} catch ( activateError ) {
					setError(
						activateError?.message ||
							__( 'Failed to activate the HEIC support plugin.' )
					);
					setIsInstalling( false );
					return;
				}
			}

			setError( message );
			setIsInstalling( false );
		}
	};

	const handleDismiss = () => {
		if ( dontAskAgain ) {
			setPreference( PREFERENCE_SCOPE, PREFERENCE_KEY, true );
		}
		onDismiss();
	};

	return (
		<Modal
			title={ __( 'HEIC Image Support' ) }
			onRequestClose={ handleDismiss }
			size="small"
		>
			<VStack spacing={ 4 }>
				<Text>
					{ fileCount === 1
						? __(
								'This image is in HEIC format, commonly used by iPhones. To upload HEIC images, a small plugin needs to be installed.'
						  )
						: __(
								'These images are in HEIC format, commonly used by iPhones. To upload HEIC images, a small plugin needs to be installed.'
						  ) }
				</Text>

				{ canInstallPlugins === false && (
					<Text>
						{ __(
							'Please ask your site administrator to install the "Client-Side HEIC Support" plugin.'
						) }
					</Text>
				) }

				{ error && (
					<Text style={ { color: '#cc1818' } }>{ error }</Text>
				) }

				{ canInstallPlugins !== false && (
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( "Don't ask again" ) }
						checked={ dontAskAgain }
						onChange={ setDontAskAgain }
					/>
				) }

				<div
					style={ {
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '8px',
					} }
				>
					<Button
						variant="tertiary"
						onClick={ handleDismiss }
						disabled={ isInstalling }
					>
						{ canInstallPlugins === false
							? __( 'OK' )
							: __( 'No Thanks' ) }
					</Button>

					{ canInstallPlugins !== false && (
						<Button
							variant="primary"
							onClick={ handleInstall }
							disabled={ isInstalling }
						>
							{ isInstalling ? (
								<>
									<Spinner />
									{ __( 'Installing…' ) }
								</>
							) : (
								__( 'Install & Upload' )
							) }
						</Button>
					) }
				</div>
			</VStack>
		</Modal>
	);
}
