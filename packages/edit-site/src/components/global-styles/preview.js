/**
 * WordPress dependencies
 */
import {
	__unstableIframe as Iframe,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import {
	__unstableMotion as motion,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useReducedMotion, useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSetting, useStyle } from './hooks';
import { useGlobalStylesOutput } from './use-global-styles-output';

const defaultColorVariants = {
	start: {
		opacity: 1,
		display: 'block',
	},
	hover: {
		opacity: 0,
		display: 'none',
	},
};

const paletteMotionVariants = {
	start: {
		y: '100%',
		opacity: 0,
		display: 'none',
	},
	hover: {
		y: 0,
		opacity: 1,
		display: 'block',
	},
};

const normalizedWidth = 250;

const StylesPreview = () => {
	const [ fontFamily = 'serif' ] = useStyle( 'typography.fontFamily' );
	const [ textColor = 'black' ] = useStyle( 'color.text' );
	const [ linkColor = 'blue' ] = useStyle( 'elements.link.color.text' );
	const [ backgroundColor = 'white' ] = useStyle( 'color.background' );
	const [ gradientValue ] = useStyle( 'color.gradient' );
	const [ styles ] = useGlobalStylesOutput();
	const disableMotion = useReducedMotion();
	const [ isHovered, setIsHovered ] = useState( false );
	const [ themeColors ] = useSetting( 'color.palette.theme' );
	const [ customColors ] = useSetting( 'color.palette.custom' );
	const [ containerResizeListener, { width } ] = useResizeObserver();
	const ratio = width ? width / normalizedWidth : 1;
	return (
		<Iframe
			className="edit-site-global-styles-preview__iframe"
			head={ <EditorStyles styles={ styles } /> }
			style={ {
				height: 150 * ratio,
				visibility: ! width ? 'hidden' : 'visible',
			} }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
		>
			{ containerResizeListener }
			<motion.div
				style={ {
					height: '100%',
					width: '100%',
					background: gradientValue ?? backgroundColor,
					cursor: 'pointer',
				} }
				initial="start"
				animate={ isHovered && ! disableMotion ? 'hover' : 'start' }
				layout={ ! disableMotion }
			>
				<HStack
					style={ {
						height: '100%',
						overflow: 'hidden',
					} }
					spacing={ 4 * ratio }
					justify="center"
				>
					<div
						style={ {
							fontFamily,
							fontSize: 65 * ratio,
						} }
					>
						Aa
					</div>
					<motion.div
						variants={ defaultColorVariants }
						transition={ { duration: 0.5 } }
					>
						<VStack spacing={ 2 * ratio }>
							<div
								style={ {
									height: 30 * ratio,
									width: 30 * ratio,
									background: textColor,
									borderRadius: 15 * ratio,
								} }
							/>
							<div
								style={ {
									height: 30 * ratio,
									width: 30 * ratio,
									background: linkColor,
									borderRadius: 15 * ratio,
								} }
							/>
						</VStack>
					</motion.div>
					<motion.div
						variants={ paletteMotionVariants }
						transition={ { duration: 0.5 } }
					>
						<VStack spacing={ 2 * ratio }>
							{ themeColors
								.concat( customColors )
								.slice( 0, 4 )
								.map( ( { color }, index ) => (
									<div
										key={ index }
										style={ {
											height: 30 * ratio,
											width: 30 * ratio,
											background: color,
											borderRadius: 15 * ratio,
										} }
									/>
								) ) }
						</VStack>
					</motion.div>
				</HStack>
			</motion.div>
		</Iframe>
	);
};

export default StylesPreview;
