/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	LinkSettingsNavigation,
	FooterMessageLink,
} from '@wordpress/components';
import { isURL } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useRef } from '@wordpress/element';

const linkSettingsOptions = {
	url: {
		label: __( 'Embed link' ),
		placeholder: __( 'Add link' ),
		autoFocus: true,
		autoFill: true,
	},
	footer: {
		label: (
			<FooterMessageLink
				href={ __( 'https://wordpress.org/support/article/embeds/' ) }
				value={ __( 'Learn more about embeds' ) }
			/>
		),
		separatorType: 'topFullWidth',
	},
};

const EmbedBottomSheet = ( { value, isVisible, onClose, onSubmit } ) => {
	const url = useRef( value );
	const { createErrorNotice } = useDispatch( noticesStore );

	const onDismiss = useCallback( () => {
		const currentUrl = url.current;
		if ( currentUrl !== '' && currentUrl !== value ) {
			if ( isURL( currentUrl ) ) {
				onSubmit( currentUrl );
			} else {
				createErrorNotice(
					__( 'Invalid URL. Please enter a valid URL.' )
				);
			}
		}
	}, [ url.current, onSubmit ] );

	function setAttributes( attributes ) {
		url.current = attributes.url;
	}

	return (
		<LinkSettingsNavigation
			isVisible={ isVisible }
			url={ value }
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
