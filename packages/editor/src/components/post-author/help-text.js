import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

export default function AuthorHelpText() {
	return createInterpolateElement(
		__( 'You can edit your display name in <a>your profile</a>.' ),
		{
			a: <Link href="profile.php" openInNewTab />,
		}
	);
}
