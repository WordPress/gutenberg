/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { LinkSettingsNavigation } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { isURL } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

const linkSettingsOptions = {
	url: {
		label: __( 'Insert from URL' ),
		placeholder: __( 'Add link' ),
		autoFocus: true,
		autoFill: true,
	},
};

const AddFromUrlBottomSheet = ( { value, onClose, isVisible } ) => {
	const [ url, setUrl ] = useState( value );
	const { createErrorNotice } = useDispatch( noticesStore );

	function onCloseWithUrl() {
		if ( ! isEmpty( url ) ) {
			if ( isURL( url ) ) {
				onClose( { url } );
				console.log(url);

			} else {
				createErrorNotice(
					__( 'Invalid URL. Please enter a valid URL.' )
				);
				onClose( {} );
			}
		} else {
			onClose( {} );
		}
	}

	return (
		<LinkSettingsNavigation
			isVisible={ isVisible }
			url={ url }
			setAttributes={ ( attributes ) => setUrl( attributes.url ) }
			onClose={ onCloseWithUrl }
			options={ linkSettingsOptions }
			withBottomSheet
			showIcon
		/>
	);
};

export default AddFromUrlBottomSheet;
