/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

export default function NavigableRegion( {
	children,
	className,
	ariaLabel,
	useMotion = false,
	...props
} ) {
	const Tag = useMotion ? motion.div : 'div';

	const motionProps = useMotion
		? {
				initial: props.initial,
				whileHover: props.whileHover,
				variants: props.variants,
				transition: props.transition,
		  }
		: {};

	return (
		<Tag
			className={ classnames( 'interface-navigable-region', className ) }
			aria-label={ ariaLabel }
			role="region"
			tabIndex="-1"
			{ ...motionProps }
		>
			<div className="interface-navigable-region__stacker">
				{ children }
			</div>
		</Tag>
	);
}
