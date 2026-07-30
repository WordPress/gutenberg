/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	TextControl,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { isValidVideoEmbedUrl } from '../embed-video-utils';

export default function EmbedVideoUrlInput( {
	onSubmit,
	onClose,
	initialUrl = '',
	allowedVideoProviders,
} ) {
	const [ url, setUrl ] = useState( initialUrl );
	const [ error, setError ] = useState( '' );

	const handleConfirm = () => {
		if ( ! url ) {
			setError( __( 'Please enter a URL.' ) );
			return;
		}

		if ( ! isValidVideoEmbedUrl( url, allowedVideoProviders ) ) {
			setError(
				__(
					'This URL is not supported. Please enter a valid video link from a supported provider.'
				)
			);
			return;
		}

		onSubmit( url );
		onClose();
	};

	return (
		<ConfirmDialog
			isOpen
			onConfirm={ handleConfirm }
			onCancel={ onClose }
			confirmButtonText={ __( 'Add video' ) }
			size="medium"
		>
			<Stack direction="column" gap="lg">
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				<TextControl
					type="url"
					label={ __( 'Video URL' ) }
					value={ url }
					onChange={ ( value ) => {
						setUrl( value );
						setError( '' );
					} }
					placeholder={ __(
						'Enter YouTube, Vimeo, or other video URL'
					) }
					help={ __(
						'Add a background video to the cover block that will autoplay in a loop.'
					) }
				/>
			</Stack>
		</ConfirmDialog>
	);
}
