/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { layout, pencil, styles as stylesIcon } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { FeatureHighlight, HeaderBackground } from './components';
import styles from './style.module.css';

const DISPLAY_VERSION = '7.1';

export default function WelcomeBanner() {
	return (
		<Stack className={ styles.root } direction="column" gap="lg">
			<Stack
				className={ styles.banner }
				direction="column"
				justify="center"
			>
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

			<Stack className={ styles.columns }>
				<FeatureHighlight
					icon={ pencil }
					title={ __(
						'Author rich content with blocks and patterns'
					) }
					description={ __(
						'Block patterns are pre-configured block layouts. Use them to get inspired or create new pages in a flash.'
					) }
					ctaUrl="/wp-admin/post-new.php?post_type=page"
					ctaLabel={ __( 'Add a new page' ) }
				/>

				<FeatureHighlight
					icon={ layout }
					title={ __(
						'Customize your entire site with block themes'
					) }
					description={ __(
						'Design everything on your site — from the header down to the footer, all using blocks and patterns.'
					) }
					ctaUrl="/wp-admin/site-editor.php"
					ctaLabel={ __( 'Open site editor' ) }
				/>

				<FeatureHighlight
					icon={ stylesIcon }
					title={ __(
						'Switch up your site’s look & feel with Styles'
					) }
					description={ __(
						'Tweak your site, or give it a whole new look! Get creative — how about a new color palette or font?'
					) }
					ctaUrl="/wp-admin/site-editor.php?p=%2Fstyles"
					ctaLabel={ __( 'Edit styles' ) }
				/>
			</Stack>
		</Stack>
	);
}
