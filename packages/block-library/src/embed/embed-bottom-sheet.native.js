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
import { useState } from '@wordpress/element';

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

const EmbedBottomSheet = ( { value, isVisible, onClose, onChangeURL } ) => {
	const [ url, setUrl ] = useState( value );
	const { createErrorNotice } = useDispatch( noticesStore );

	function onDismiss() {
		if ( url !== value && url !== '' ) {
			onChangeURL( url );
		}
	}

	function setAttributes( { url: nextUrl } ) {
		if ( isURL( nextUrl ) ) {
			setUrl( nextUrl );
		} else if ( nextUrl !== '' ) {
			createErrorNotice( __( 'Invalid URL. Please enter a valid URL.' ) );
		}
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
