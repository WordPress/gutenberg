/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { HeaderBackground } from '../header-background';
import styles from './banner.module.css';

const DISPLAY_VERSION = '7.1';

export function Banner( { titleId }: Pick< WidgetRenderProps, 'titleId' > ) {
	const currentUserName = useSelect(
		( select ) =>
			( ( select( coreStore ) as any ).getCurrentUser()
				?.name as string ) ?? '',
		[]
	);
	const trimmedCurrentUserName = currentUserName.trim();

	return (
		<Stack className={ styles.banner } direction="column" justify="center">
			<HeaderBackground version={ DISPLAY_VERSION } />

			<hgroup className={ styles.bannerContent }>
				<Text id={ titleId } variant="heading-2xl" render={ <h2 /> }>
					{ trimmedCurrentUserName
						? sprintf(
								/* translators: %s: Current user's display name. */
								__( 'Howdy, %s' ),
								trimmedCurrentUserName
						  )
						: __( 'Howdy' ) }
				</Text>

				<Text render={ <p /> } variant="heading-lg">
					{ __( 'Welcome to WordPress!' ) }
				</Text>

				<Text render={ <p /> } variant="heading-lg">
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
			</hgroup>
		</Stack>
	);
}
