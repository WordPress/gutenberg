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
		window.localStorage.setItem(
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
							'To install fonts from Google you must give permission to connect directly to Google servers. The fonts you install will be downloaded from Google and stored on your site. Your site will then use these locally-hosted fonts.'
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
