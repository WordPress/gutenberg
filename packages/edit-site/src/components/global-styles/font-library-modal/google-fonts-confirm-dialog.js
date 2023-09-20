/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	__experimentalText as Text,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

function GoogleFontsConfirmDialog() {
	const handleConfirm = () => {
		// eslint-disable-next-line no-undef
		localStorage.setItem(
			'wp-font-library-google-fonts-permission',
			'true'
		);
		window.dispatchEvent( new Event( 'storage' ) );
	};

	return (
		<div className="font-library__google-fonts-confirm">
			<Card>
				<CardBody>
					<Text as="h3">Connect to Google Fonts</Text>
					<Spacer margin={ 6 } />
					<Text as="p">
						{ __(
							'To install Google Fonts you have to give permission to connect directly to Google Servers. The fonts install will be downloaded from Google servers at install time and stored in your server.'
						) }
					</Text>
					<Spacer margin={ 3 } />
					<Text as="p">
						{ __(
							'You can alternatively upload files directly on the Library tab.'
						) }
					</Text>
					<Spacer margin={ 6 } />
					<Button variant="primary" onClick={ handleConfirm }>
						{ __( 'Allow access to Google Fonts' ) }
					</Button>
				</CardBody>
			</Card>
		</div>
	);
}

export default GoogleFontsConfirmDialog;
