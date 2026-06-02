/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { HeaderBackground } from '../header-background';
import styles from './banner.module.css';

const DISPLAY_VERSION = '7.1';

interface BannerProps {
	isWide?: boolean;
	isTiny?: boolean;
}

export function Banner( { isWide = false, isTiny = false }: BannerProps ) {
	const className = clsx(
		styles.banner,
		isWide && styles.wide,
		isTiny && styles.tiny
	);

	return (
		<Stack className={ className } direction="column" justify="center">
			<HeaderBackground />

			<Stack
				className={ styles.bannerContent }
				gap="sm"
				direction="column"
			>
				<Text variant="heading-2xl">
					{ __( 'Welcome to WordPress!' ) }
				</Text>

				<Text variant="heading-lg">
					<Link
						className={ styles.bannerLink }
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
