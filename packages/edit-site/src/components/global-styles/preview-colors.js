/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__unstableMotion as motion,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PresetColors from './preset-colors';
import PreviewIframe from './preview-iframe';

const firstFrameVariants = {
	start: {
		scale: 1,
		opacity: 1,
	},
	hover: {
		scale: 0,
		opacity: 0,
	},
};

const StylesPreviewColors = ( { label, isFocused, withHoverView } ) => {
	return (
		<PreviewIframe
			label={ label }
			isFocused={ isFocused }
			withHoverView={ withHoverView }
		>
			{ ( { key } ) => (
				<motion.div
					key={ key }
					variants={ firstFrameVariants }
					style={ {
						height: '100%',
						overflow: 'hidden',
					} }
				>
					<HStack
						spacing={ 0 }
						justify="center"
						style={ {
							height: '100%',
							overflow: 'hidden',
						} }
					>
						<PresetColors />
					</HStack>
				</motion.div>
			) }
		</PreviewIframe>
	);
};

export default StylesPreviewColors;
