import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { HeaderBackground } from '../header-background';
import styles from './banner.module.css';

const DISPLAY_VERSION = '7.1';

export function Banner() {
	return (
		<Stack className={ styles.banner } direction="column" justify="center">
			<HeaderBackground version={ DISPLAY_VERSION } />

			<Stack
				className={ styles[ 'banner-content' ] }
				gap="sm"
				direction="column"
			>
				<Text variant="heading-2xl">
					{ __( 'Welcome to WordPress!' ) }
				</Text>

				<Text variant="heading-lg">
					<Link
						className={ styles[ 'banner-link' ] }
						href="/wp-admin/about.php"
						variant="unstyled"
					>
						{ sprintf(
							/* translators: %s: Current WordPress version. */
							__( 'Learn more about the %s version.' ),
							DISPLAY_VERSION
						) }
					</Link>
				</Text>
			</Stack>
		</Stack>
	);
}
