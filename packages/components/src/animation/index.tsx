/**
 * Framer Motion is used to create animated, interactive interfaces. The package is roughly ~30kb so
 * this should ideally be loaded once across all Gutenberg packages. To give ourselves more flexibility
 * in trying animation options, we avoid making this public API.
 *
 * @see https://www.framer.com/docs/animation/
 */

// eslint-disable-next-line no-restricted-imports
export {
	motion as __unstableMotion,
	AnimatePresence as __unstableAnimatePresence,
	MotionContext as __unstableMotionContext,
} from 'framer-motion';
