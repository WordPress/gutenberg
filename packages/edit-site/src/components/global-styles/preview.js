/**
 * WordPress dependencies
 */
import {
	__unstableIframe as Iframe,
	__unstableEditorStyles as EditorStyles,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	__unstableMotion as motion,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useReducedMotion, useResizeObserver } from '@wordpress/compose';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useGlobalSetting, useGlobalStyle, useGlobalStylesOutput } = unlock(
	blockEditorPrivateApis
);

const firstFrame = {
	start: {
		scale: 1,
		opacity: 1,
	},
	hover: {
		scale: 0,
		opacity: 0,
	},
};

const midFrame = {
	hover: {
		opacity: 1,
	},
	start: {
		opacity: 0.5,
	},
};

const secondFrame = {
	hover: {
		scale: 1,
		opacity: 1,
	},
	start: {
		scale: 0,
		opacity: 0,
	},
};

const normalizedWidth = 248;
const normalizedHeight = 152;

const normalizedColorSwatchSize = 32;

const StylesPreview = ( { label, isFocused, withHoverView } ) => {
	const [ fontWeight ] = useGlobalStyle( 'typography.fontWeight' );
	const [ fontFamily = 'serif' ] = useGlobalStyle( 'typography.fontFamily' );
	const [ headingFontFamily = fontFamily ] = useGlobalStyle(
		'elements.h1.typography.fontFamily'
	);
	const [ headingFontWeight = fontWeight ] = useGlobalStyle(
		'elements.h1.typography.fontWeight'
	);
	const [ textColor = 'black' ] = useGlobalStyle( 'color.text' );
	const [ headingColor = textColor ] = useGlobalStyle(
		'elements.h1.color.text'
	);
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const [ gradientValue ] = useGlobalStyle( 'color.gradient' );
	const [ styles ] = useGlobalStylesOutput();
	const disableMotion = useReducedMotion();
	const [ coreColors ] = useGlobalSetting( 'color.palette.core' );
	const [ themeColors ] = useGlobalSetting( 'color.palette.theme' );
	const [ customColors ] = useGlobalSetting( 'color.palette.custom' );
	const [ isHovered, setIsHovered ] = useState( false );
	const [ containerResizeListener, { width } ] = useResizeObserver();
	const ratio = width ? width / normalizedWidth : 1;

	const paletteColors = ( themeColors ?? [] )
		.concat( customColors ?? [] )
		.concat( coreColors ?? [] );
	const highlightedColors = paletteColors
		.filter(
			// we exclude these two colors because they are already visible in the preview.
			( { color } ) => color !== backgroundColor && color !== headingColor
		)
		.slice( 0, 2 );

	// Reset leaked styles from WP common.css and remove main content layout padding and border.
	const editorStyles = useMemo( () => {
		if ( styles ) {
			return [
				...styles,
				{
					css: 'html{overflow:hidden}body{min-width: 0;padding: 0;border: none;}',
					isGlobalStyles: true,
				},
			];
		}

		return styles;
	}, [ styles ] );
	const isReady = !! width;

	return (
		<>
			<div style={ { position: 'relative' } }>
				{ containerResizeListener }
			</div>
			{ isReady && (
				<Iframe
					className="edit-site-global-styles-preview__iframe"
					style={ {
						height: normalizedHeight * ratio,
					} }
					onMouseEnter={ () => setIsHovered( true ) }
					onMouseLeave={ () => setIsHovered( false ) }
					tabIndex={ -1 }
				>
					<EditorStyles styles={ editorStyles } />
					<motion.div
						style={ {
							height: normalizedHeight * ratio,
							width: '100%',
							background: gradientValue ?? backgroundColor,
							cursor: withHoverView ? 'pointer' : undefined,
						} }
						initial="start"
						animate={
							( isHovered || isFocused ) &&
							! disableMotion &&
							label
								? 'hover'
								: 'start'
						}
					>
						<motion.div
							variants={ firstFrame }
							style={ {
								height: '100%',
								overflow: 'hidden',
							} }
						>
							<HStack
								spacing={ 10 * ratio }
								justify="center"
								style={ {
									height: '100%',
									overflow: 'hidden',
								} }
							>
								<motion.div
									style={ {
										fontFamily: headingFontFamily,
										fontSize: 65 * ratio,
										color: headingColor,
										fontWeight: headingFontWeight,
									} }
									animate={ { scale: 1, opacity: 1 } }
									initial={ { scale: 0.1, opacity: 0 } }
									transition={ { delay: 0.3, type: 'tween' } }
								>
									Aa
								</motion.div>
								<VStack spacing={ 4 * ratio }>
									{ highlightedColors.map(
										( { slug, color }, index ) => (
											<motion.div
												key={ slug }
												style={ {
													height:
														normalizedColorSwatchSize *
														ratio,
													width:
														normalizedColorSwatchSize *
														ratio,
													background: color,
													borderRadius:
														( normalizedColorSwatchSize *
															ratio ) /
														2,
												} }
												animate={ {
													scale: 1,
													opacity: 1,
												} }
												initial={ {
													scale: 0.1,
													opacity: 0,
												} }
												transition={ {
													delay:
														index === 1 ? 0.2 : 0.1,
												} }
											/>
										)
									) }
								</VStack>
							</HStack>
						</motion.div>
						<motion.div
							variants={ withHoverView && midFrame }
							style={ {
								height: '100%',
								width: '100%',
								position: 'absolute',
								top: 0,
								overflow: 'hidden',
								filter: 'blur(60px)',
								opacity: 0.1,
							} }
						>
							<HStack
								spacing={ 0 }
								justify="flex-start"
								style={ {
									height: '100%',
									overflow: 'hidden',
								} }
							>
								{ paletteColors
									.slice( 0, 4 )
									.map( ( { color }, index ) => (
										<div
											key={ index }
											style={ {
												height: '100%',
												background: color,
												flexGrow: 1,
											} }
										/>
									) ) }
							</HStack>
						</motion.div>
						<motion.div
							variants={ secondFrame }
							style={ {
								height: '100%',
								width: '100%',
								overflow: 'hidden',
								position: 'absolute',
								top: 0,
							} }
						>
							<VStack
								spacing={ 3 * ratio }
								justify="center"
								style={ {
									height: '100%',
									overflow: 'hidden',
									padding: 10 * ratio,
									boxSizing: 'border-box',
								} }
							>
								{ label && (
									<div
										style={ {
											fontSize: 40 * ratio,
											fontFamily: headingFontFamily,
											color: headingColor,
											fontWeight: headingFontWeight,
											lineHeight: '1em',
											textAlign: 'center',
										} }
									>
										{ label }
									</div>
								) }
							</VStack>
						</motion.div>
					</motion.div>
				</Iframe>
			) }
		</>
	);
};

export default StylesPreview;
