/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { arrowUpLeft } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SiteIcon from '../site-icon';
import './back-button.scss';

/**
 * Overlay arrow animation that appears on hover.
 * Matches next-admin implementation with clip-path.
 */
const toggleHomeIconVariants = {
	edit: {
		opacity: 0,
		scale: 0.2,
	},
	hover: {
		opacity: 1,
		scale: 1,
		clipPath: 'inset( 22% round 2px )',
	},
};

/**
 * Back button component that appears in full-screen canvas mode.
 * Matches next-admin's SiteIconBackButton design.
 *
 * @param {Object} props        Component props
 * @param {number} props.length Number of BackButton fills (from Slot)
 * @return Back button with slide and hover animations
 */
export default function BootBackButton( { length }: { length: number } ) {
	const disableMotion = useReducedMotion();

	const handleBack = () => {
		window.history.back();
	};

	// Only render if this is the only back button
	if ( length > 1 ) {
		return null;
	}

	const transition = {
		duration: disableMotion ? 0 : 0.3,
	};

	return (
		<motion.div
			className="boot-canvas-back-button"
			animate="edit"
			initial="edit"
			whileHover="hover"
			whileTap="tap"
			transition={ transition }
		>
			<Button
				className="boot-canvas-back-button__link"
				onClick={ handleBack }
				aria-label={ __( 'Go back' ) }
				__next40pxDefaultSize
			>
				<SiteIcon />
			</Button>

			{ /* Overlay arrow that appears on hover */ }
			<motion.div
				className="boot-canvas-back-button__icon"
				variants={ toggleHomeIconVariants }
			>
				<Icon icon={ arrowUpLeft } />
			</motion.div>
		</motion.div>
	);
}
