/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { layout, pencil, styles as stylesIcon } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { Banner, FeatureHighlight } from './components';
import styles from './style.module.css';

export default function WelcomeBanner() {
	const isClassicTheme = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()?.is_block_theme === false,
		[]
	);

	const customizeFeature = isClassicTheme
		? {
				icon: layout,
				title: __( 'Start customizing' ),
				description: __(
					'Configure your site’s logo, header, menus, and more in the Customizer.'
				),
				ctaUrl: '/wp-admin/customize.php',
				ctaLabel: __( 'Open the Customizer' ),
		  }
		: {
				icon: layout,
				title: __( 'Customize your entire site with block themes' ),
				description: __(
					'Design everything on your site — from the header down to the footer, all using blocks and patterns.'
				),
				ctaUrl: '/wp-admin/site-editor.php',
				ctaLabel: __( 'Open site editor' ),
		  };

	const stylesFeature = isClassicTheme
		? {
				icon: stylesIcon,
				title: __( 'Discover a new way to build your site' ),
				description: __(
					'There is a new kind of WordPress theme, called a block theme, that lets you build the site you’ve always wanted — with blocks and styles.'
				),
				ctaUrl: 'https://wordpress.org/documentation/article/block-themes/',
				ctaLabel: __( 'Learn about block themes' ),
		  }
		: {
				icon: stylesIcon,
				title: __( 'Switch up your site’s look & feel with Styles' ),
				description: __(
					'Tweak your site, or give it a whole new look! Get creative — how about a new color palette or font?'
				),
				ctaUrl: '/wp-admin/site-editor.php?p=%2Fstyles',
				ctaLabel: __( 'Edit styles' ),
		  };

	return (
		<Stack className={ styles.root } direction="column" gap="lg">
			<Banner />

			<Stack className={ styles.columns }>
				<FeatureHighlight
					icon={ pencil }
					title={ __(
						'Author rich content with blocks and patterns'
					) }
					description={ __(
						'Patterns are pre-configured block layouts. Use them to get inspired or create new pages in a flash.'
					) }
					ctaUrl="/wp-admin/post-new.php?post_type=page"
					ctaLabel={ __( 'Add a new page' ) }
				/>

				<FeatureHighlight { ...customizeFeature } />

				<FeatureHighlight { ...stylesFeature } />
			</Stack>
		</Stack>
	);
}
