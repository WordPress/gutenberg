/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { Popover, __unstableMotion as motion } from '@wordpress/components';

const animateVariants = {
	hide: { opacity: 0, scaleY: 0.75 },
	show: { opacity: 1, scaleY: 1 },
	exit: { opacity: 0, scaleY: 0.9 },
};

export default function DropZone( { paragraphElement } ) {
	const reducedMotion = useReducedMotion();

	return (
		<Popover
			anchor={ paragraphElement }
			animate={ false }
			placement="top-start"
			focusOnMount={ false }
			flip={ false }
			resize={ false }
			className="wp-block-paragraph__drop-zone"
		>
			<motion.div
				style={ {
					width: paragraphElement?.offsetWidth,
					height: paragraphElement?.offsetHeight,
				} }
				data-testid="empty-paragraph-drop-zone"
				initial={
					reducedMotion ? animateVariants.show : animateVariants.hide
				}
				animate={ animateVariants.show }
				exit={
					reducedMotion ? animateVariants.show : animateVariants.exit
				}
				className="wp-block-paragraph__drop-zone-foreground"
			/>
		</Popover>
	);
}
