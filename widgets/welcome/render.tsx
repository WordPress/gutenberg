/**
 * WordPress dependencies
 */
import { useId, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card, IconButton, Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import styles from './style.module.css';

declare global {
	interface Window {
		wpDashboardWidgetsConfig?: {
			wpVersion?: string;
		};
	}
}

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBlocks() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<rect width="48" height="48" rx="4" fill="#1E1E1E" />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M32.0668 17.0854L28.8221 13.9454L18.2008 24.671L16.8983 29.0827L21.4257 27.8309L32.0668 17.0854ZM16 32.75H24V31.25H16V32.75Z"
				fill="white"
			/>
		</svg>
	);
}

function IconLayout() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<rect width="48" height="48" rx="4" fill="#1E1E1E" />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18 16h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2zm12 1.5H18a.5.5 0 0 0-.5.5v3h13v-3a.5.5 0 0 0-.5-.5zm.5 5H22v8h8a.5.5 0 0 0 .5-.5v-7.5zm-10 0h-3V30a.5.5 0 0 0 .5.5h2.5v-8z"
				fill="#fff"
			/>
		</svg>
	);
}

function IconStyles() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<rect width="48" height="48" rx="4" fill="#1E1E1E" />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M31 24a7 7 0 0 1-7 7V17a7 7 0 0 1 7 7zm-7-8a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"
				fill="#fff"
			/>
		</svg>
	);
}

// ─── Background SVG ───────────────────────────────────────────────────────────

function DashboardBackground() {
	const uid = useId();
	const ids = {
		clip: `${ uid }-clip`,
		mask: `${ uid }-mask`,
		line1: `${ uid }-line-1`,
		line2: `${ uid }-line-2`,
		line3: `${ uid }-line-3`,
		line4: `${ uid }-line-4`,
		line5: `${ uid }-line-5`,
		radial1: `${ uid }-radial-1`,
		radial2: `${ uid }-radial-2`,
	};

	return (
		<svg
			preserveAspectRatio="xMidYMin slice"
			viewBox="0 0 1232 240"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<g clipPath={ `url(#${ ids.clip })` }>
				<path fill="#151515" d="M0 0h1232v240H0z" />
				<ellipse
					cx="616"
					cy="232"
					fill={ `url(#${ ids.radial1 })` }
					opacity=".05"
					rx="1497"
					ry="249"
				/>
				<mask
					id={ ids.mask }
					width="1000"
					height="400"
					x="232"
					y="20"
					maskUnits="userSpaceOnUse"
					style={ { maskType: 'alpha' } }
				>
					<path
						fill={ `url(#${ ids.radial2 })` }
						d="M0 0h1000v400H0z"
						transform="translate(232 20)"
					/>
				</mask>
				<g strokeWidth="2" mask={ `url(#${ ids.mask })` }>
					<path stroke={ `url(#${ ids.line1 })` } d="M387 20v1635" />
					<path
						stroke={ `url(#${ ids.line2 })` }
						d="M559.5 20v1635"
					/>
					<path stroke={ `url(#${ ids.line3 })` } d="M732 20v1635" />
					<path
						stroke={ `url(#${ ids.line4 })` }
						d="M904.5 20v1635"
					/>
					<path stroke={ `url(#${ ids.line5 })` } d="M1077 20v1635" />
				</g>
			</g>
			<defs>
				<linearGradient
					id={ ids.line1 }
					x1="387.5"
					x2="387.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3858E9" stopOpacity="0" />
					<stop offset=".297" stopColor="#3858E9" />
					<stop offset=".734" stopColor="#3858E9" />
					<stop offset="1" stopColor="#3858E9" stopOpacity="0" />
				</linearGradient>
				<linearGradient
					id={ ids.line2 }
					x1="560"
					x2="560"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#FFFCB5" stopOpacity="0" />
					<stop offset=".297" stopColor="#FFFCB5" />
					<stop offset=".734" stopColor="#FFFCB5" />
					<stop offset="1" stopColor="#FFFCB5" stopOpacity="0" />
				</linearGradient>
				<linearGradient
					id={ ids.line3 }
					x1="732.5"
					x2="732.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#C7FFDB" stopOpacity="0" />
					<stop offset=".297" stopColor="#C7FFDB" />
					<stop offset=".693" stopColor="#C7FFDB" />
					<stop offset="1" stopColor="#C7FFDB" stopOpacity="0" />
				</linearGradient>
				<linearGradient
					id={ ids.line4 }
					x1="905"
					x2="905"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#FFB7A7" stopOpacity="0" />
					<stop offset=".297" stopColor="#FFB7A7" />
					<stop offset=".734" stopColor="#FFB7A7" />
					<stop offset="1" stopColor="#FFB7A7" stopOpacity="0" />
				</linearGradient>
				<linearGradient
					id={ ids.line5 }
					x1="1077.5"
					x2="1077.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#7B90FF" stopOpacity="0" />
					<stop offset=".297" stopColor="#7B90FF" />
					<stop offset=".734" stopColor="#7B90FF" />
					<stop offset="1" stopColor="#7B90FF" stopOpacity="0" />
				</linearGradient>
				<radialGradient
					id={ ids.radial1 }
					cx="0"
					cy="0"
					r="1"
					gradientTransform="matrix(0 249 -1497 0 616 232)"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3858E9" />
					<stop offset="1" stopColor="#151515" stopOpacity="0" />
				</radialGradient>
				<radialGradient
					id={ ids.radial2 }
					cx="0"
					cy="0"
					r="1"
					gradientTransform="matrix(0 765 -1912.5 0 500 -110)"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset=".161" stopColor="#151515" stopOpacity="0" />
					<stop offset=".682" />
				</radialGradient>
				<clipPath id={ ids.clip }>
					<path fill="#fff" d="M0 0h1232v240H0z" />
				</clipPath>
			</defs>
		</svg>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Welcome() {
	const displayVersion = window.wpDashboardWidgetsConfig?.wpVersion ?? '';
	const currentTheme = useSelect(
		( select ) => ( select( coreStore ) as any ).getCurrentTheme(),
		[]
	);

	const canCustomize = useSelect(
		( select ) =>
			!! ( select( coreStore ).getCurrentUser() as any )?.capabilities
				?.customize,
		[]
	);

	const isBlockTheme = !! currentTheme?.is_block_theme;
	const [ isDismissed, setIsDismissed ] = useState( false );

	if ( isDismissed ) {
		return null;
	}

	return (
		<>
			<ThemeProvider color={ { bg: '#000000' } }>
				<div className={ styles.headerWrap }>
					<div className={ styles.headerImage } aria-hidden="true">
						<DashboardBackground />
					</div>
					<div className={ styles.header }>
						<IconButton
							className={ styles.dismissButton }
							variant="minimal"
							tone="neutral"
							size="compact"
							icon={ close }
							label={ __( 'Dismiss welcome panel' ) }
							onClick={ () => setIsDismissed( true ) }
						/>
						<Text variant="heading-2xl" render={ <h2 /> }>
							{ __( 'Welcome to WordPress!' ) }
						</Text>
						{ displayVersion && (
							<Text variant="body-xl" render={ <p /> }>
								<Link href="about.php">
									{ sprintf(
										/* translators: %s: Current WordPress version. */
										__(
											'Learn more about the %s version.'
										),
										displayVersion
									) }
								</Link>
							</Text>
						) }
					</div>
				</div>
			</ThemeProvider>

			<Card.Content>
				<Stack
					className={ styles.columns }
					direction="row"
					gap="lg"
					wrap="wrap"
				>
					<Stack gap="lg" className={ styles.column }>
						<IconBlocks />
						<Stack
							className={ styles.columnContent }
							direction="column"
							gap="sm"
							align="start"
						>
							<Text variant="heading-lg" render={ <h3 /> }>
								{ __(
									'Author rich content with blocks and patterns'
								) }
							</Text>
							<Text variant="body-lg" render={ <p /> }>
								{ __(
									'Block patterns are pre-configured block layouts. Use them to get inspired or create new pages in a flash.'
								) }
							</Text>
							<Text variant="body-lg">
								<Link href="post-new.php?post_type=page">
									{ __( 'Add a new page' ) }
								</Link>
							</Text>
						</Stack>
					</Stack>

					<Stack gap="lg" className={ styles.column }>
						<IconLayout />
						<Stack
							className={ styles.columnContent }
							direction="column"
							gap="sm"
							align="start"
						>
							{ isBlockTheme ? (
								<>
									<Text
										variant="heading-lg"
										render={ <h3 /> }
									>
										{ __(
											'Customize your entire site with block themes'
										) }
									</Text>
									<Text variant="body-md" render={ <p /> }>
										{ __(
											'Design everything on your site \u2014 from the header down to the footer, all using blocks and patterns.'
										) }
									</Text>
									<Text variant="body-lg">
										<Link href="site-editor.php">
											{ __( 'Open site editor' ) }
										</Link>
									</Text>
								</>
							) : (
								<>
									<Text
										variant="heading-lg"
										render={ <h3 /> }
									>
										{ __( 'Start Customizing' ) }
									</Text>
									<Text variant="body-lg" render={ <p /> }>
										{ __(
											'Configure your site\u2019s logo, header, menus, and more in the Customizer.'
										) }
									</Text>
									{ canCustomize && (
										<Text variant="body-lg">
											<Link href="customize.php">
												{ __( 'Open the Customizer' ) }
											</Link>
										</Text>
									) }
								</>
							) }
						</Stack>
					</Stack>

					<Stack gap="lg" className={ styles.column }>
						<IconStyles />
						<Stack
							className={ styles.columnContent }
							direction="column"
							gap="sm"
							align="start"
						>
							{ isBlockTheme ? (
								<>
									<Text
										variant="heading-lg"
										render={ <h3 /> }
									>
										{ __(
											'Switch up your site\u2019s look & feel with Styles'
										) }
									</Text>
									<Text variant="body-lg" render={ <p /> }>
										{ __(
											'Tweak your site, or give it a whole new look! Get creative \u2014 how about a new color palette or font?'
										) }
									</Text>
									<Text variant="body-lg">
										<Link href="site-editor.php?p=%2Fstyles">
											{ __( 'Edit styles' ) }
										</Link>
									</Text>
								</>
							) : (
								<>
									<Text
										variant="heading-lg"
										render={ <h3 /> }
									>
										{ __(
											'Discover a new way to build your site.'
										) }
									</Text>
									<Text variant="body-lg" render={ <p /> }>
										{ __(
											'There is a new kind of WordPress theme, called a block theme, that lets you build the site you\u2019ve always wanted \u2014 with blocks and styles.'
										) }
									</Text>
									<Text variant="body-lg">
										<Link
											href={ __(
												'https://wordpress.org/documentation/article/block-themes/'
											) }
										>
											{ __( 'Learn about block themes' ) }
										</Link>
									</Text>
								</>
							) }
						</Stack>
					</Stack>
				</Stack>
			</Card.Content>
		</>
	);
}
