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
import { useReducedMotion } from '@wordpress/compose';
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

const StylesPreview = ( { height = 150 } ) => {
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

	return (
		<Iframe
			className="edit-site-global-styles-preview__iframe"
			head={ <EditorStyles styles={ styles } /> }
			style={ { height } }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
		>
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
					spacing={ 4 }
					justify="center"
				>
					<div
						style={ {
							fontFamily,
							fontSize: ( 65 * height ) / 150,
						} }
					>
						Aa
					</div>
					<motion.div variants={ defaultColorVariants }>
						<VStack>
							<div
								style={ {
									height: ( 30 * height ) / 150,
									width: ( 30 * height ) / 150,
									background: textColor,
									borderRadius: ( 15 * height ) / 150,
									border: '1px solid #f0f0f0',
								} }
							/>
							<div
								style={ {
									height: ( 30 * height ) / 150,
									width: ( 30 * height ) / 150,
									background: linkColor,
									borderRadius: ( 15 * height ) / 150,
									border: '1px solid #f0f0f0',
								} }
							/>
						</VStack>
					</motion.div>
					<motion.div variants={ paletteMotionVariants }>
						<VStack>
							{ themeColors
								.concat( customColors )
								.slice( 0, 4 )
								.map( ( { color }, index ) => (
									<div
										key={ index }
										style={ {
											height: ( 30 * height ) / 150,
											width: ( 30 * height ) / 150,
											background: color,
											borderRadius: ( 15 * height ) / 150,
											border: '1px solid #f0f0f0',
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
