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

const EmbedBottomSheet = ( { value, isVisible, onClose, onSetAttributes } ) => {
	const { createErrorNotice } = useDispatch( noticesStore );

	function setAttributes( attributes ) {
		const { url } = attributes;

		if ( isURL( url ) ) {
			onSetAttributes( attributes );
		} else if ( url !== '' ) {
			createErrorNotice( __( 'Invalid URL. Please enter a valid URL.' ) );
		}
	}

	return (
		<LinkSettingsNavigation
			isVisible={ isVisible }
			url={ value }
			setAttributes={ setAttributes }
			onClose={ onClose }
			options={ linkSettingsOptions }
			withBottomSheet
			showIcon
		/>
	);
};

export default EmbedBottomSheet;
