/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { layout, pencil, styles as stylesIcon } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { Banner, FeatureHighlight } from './components';
import styles from './style.module.css';

const ROW_LAYOUT_MIN_WIDTH = 800;
const ROW_LAYOUT_MAX_HEIGHT = 390;

export default function WelcomeBanner() {
	const [ isWide, setIsWide ] = useState( false );

	const setRef = useResizeObserver< HTMLDivElement >( ( [ entry ] ) => {
		setIsWide(
			entry.contentRect.width >= ROW_LAYOUT_MIN_WIDTH &&
				entry.contentRect.height <= ROW_LAYOUT_MAX_HEIGHT
		);
	} );

	return (
		<Stack
			ref={ setRef }
			className={ `${ styles.root }${
				isWide ? ` ${ styles.wide }` : ''
			}` }
			direction={ isWide ? 'row' : 'column' }
			gap="lg"
		>
			<Banner isWide={ isWide } />

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
