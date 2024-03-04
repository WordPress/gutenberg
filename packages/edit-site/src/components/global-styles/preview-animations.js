/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

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

const midFrameVariants = {
	hover: {
		opacity: 1,
	},
	start: {
		opacity: 0.5,
	},
};

const secondFrameVariants = {
	hover: {
		scale: 1,
		opacity: 1,
	},
	start: {
		scale: 0,
		opacity: 0,
	},
};

export const FirstFrame = ( { children } ) => (
	<motion.div
		variants={ firstFrameVariants }
		style={ {
			height: '100%',
			overflow: 'hidden',
		} }
	>
		{ children }
	</motion.div>
);

export const MidFrame = ( { children, withHoverView } ) => (
	<motion.div
		variants={ withHoverView && midFrameVariants }
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
		{ children }
	</motion.div>
);

export const SecondFrame = ( { children } ) => (
	<motion.div
		variants={ secondFrameVariants }
		style={ {
			height: '100%',
			width: '100%',
			overflow: 'hidden',
			position: 'absolute',
			top: 0,
		} }
	>
		{ children }
	</motion.div>
);
