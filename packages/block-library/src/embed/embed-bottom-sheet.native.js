/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	LinkSettingsNavigation,
	FooterMessageLink,
} from '@wordpress/components';
import { isURL } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useState } from '@wordpress/element';

const EmbedBottomSheet = ( { value, label, isVisible, onClose, onSubmit } ) => {
	const [ url, setURL ] = useState( value );
	const { createErrorNotice } = useDispatch( noticesStore );

	const linkSettingsOptions = {
		url: {
			label: sprintf(
				// translators: %s: embed block variant's label e.g: "Twitter".
				__( '%s link' ),
				label
			),
			placeholder: __( 'Add link' ),
			autoFocus: true,
			autoFill: true,
		},
		footer: {
			label: (
				<FooterMessageLink
					href={ __(
						'https://wordpress.org/support/article/embeds/'
					) }
					value={ __( 'Learn more about embeds' ) }
				/>
			),
			separatorType: 'topFullWidth',
		},
	};

	const onDismiss = useCallback( () => {
		if ( url !== '' ) {
			if ( isURL( url ) ) {
				onSubmit( url );
			} else {
				createErrorNotice(
					__( 'Invalid URL. Please enter a valid URL.' )
				);
				// If the URL was already defined, we submit it to stop showing the embed placeholder.
				if ( value !== '' ) {
					onSubmit( value );
				}
			}
		} else if ( value !== '' ) {
			// Resets the URL when new value is empty and URL was already defined.
			onSubmit( '' );
		}
	}, [ url, onSubmit, value ] );

	function setAttributes( attributes ) {
		setURL( attributes.url );
	}

	return (
		<LinkSettingsNavigation
			isVisible={ isVisible }
			url={ url }
			onClose={ onClose }
			onDismiss={ onDismiss }
			setAttributes={ setAttributes }
			options={ linkSettingsOptions }
			withBottomSheet
			showIcon
		/>
	);
};

export default EmbedBottomSheet;
