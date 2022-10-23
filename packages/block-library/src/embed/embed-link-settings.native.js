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
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

const EmbedLinkSettings = ( {
	autoFocus,
	value,
	label,
	isVisible,
	onClose,
	onSubmit,
	withBottomSheet,
} ) => {
	const url = useRef( value );
	const [ inputURL, setInputURL ] = useState( value );
	const { createErrorNotice } = useDispatch( noticesStore );

	const linkSettingsOptions = {
		url: {
			label: sprintf(
				// translators: %s: embed block variant's label e.g: "Twitter".
				__( '%s link' ),
				label
			),
			placeholder: __( 'Add link' ),
			autoFocus,
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
		if ( ! isURL( url.current ) && url.current !== '' ) {
			createErrorNotice( __( 'Invalid URL. Please enter a valid URL.' ) );
			// If the URL was already defined, we submit it to stop showing the embed placeholder.
			onSubmit( value );
			return;
		}
		onSubmit( url.current );
	}, [ onSubmit, value ] );

	useEffect( () => {
		url.current = value;
		setInputURL( value );
	}, [ value ] );

	/**
	 * If the Embed Bottom Sheet component does not utilize a bottom sheet then the onDismiss action is not
	 * called. Here we are wiring the onDismiss to the onClose callback that gets triggered when input is submitted.
	 */
	const performOnCloseOperations = useCallback( () => {
		if ( onClose ) {
			onClose();
		}

		if ( ! withBottomSheet ) {
			onDismiss();
		}
	}, [ onClose ] );

	const onSetAttributes = useCallback( ( attributes ) => {
		url.current = attributes.url;
		setInputURL( attributes.url );
	}, [] );

	return (
		<LinkSettingsNavigation
			isVisible={ isVisible }
			url={ inputURL }
			onClose={ performOnCloseOperations }
			onDismiss={ onDismiss }
			setAttributes={ onSetAttributes }
			options={ linkSettingsOptions }
			testID="embed-edit-url-modal"
			withBottomSheet={ withBottomSheet }
			showIcon
		/>
	);
};

export default EmbedLinkSettings;
