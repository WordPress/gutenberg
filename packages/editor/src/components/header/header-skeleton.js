/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BackButton, { useHasBackButton } from './back-button';

const toolbarVariations = {
	distractionFreeDisabled: { y: '-50px' },
	distractionFreeHover: { y: 0 },
	distractionFreeHidden: { y: '-50px' },
	visible: { y: 0 },
	hidden: { y: 0 },
};

const backButtonVariations = {
	distractionFreeDisabled: { x: '-100%' },
	distractionFreeHover: { x: 0 },
	distractionFreeHidden: { x: '-100%' },
	visible: { x: 0 },
	hidden: { x: 0 },
};

/**
 * Header skeleton component providing the common layout structure.
 *
 * @param {Object}      props           Component props.
 * @param {string}      props.className Additional class name.
 * @param {JSX.Element} props.toolbar   Content for the left toolbar area.
 * @param {JSX.Element} props.center    Content for the center area.
 * @param {JSX.Element} props.settings  Content for the right settings area.
 * @return {JSX.Element} The header skeleton component.
 */
export default function HeaderSkeleton( {
	className,
	toolbar,
	center,
	settings,
} ) {
	const hasBackButton = useHasBackButton();

	/*
	 * The edit-post-header classname is only kept for backward compatibility
	 * as some plugins might be relying on its presence.
	 */
	return (
		<div className={ clsx( 'editor-header edit-post-header', className ) }>
			{ hasBackButton && (
				<motion.div
					className="editor-header__back-button"
					variants={ backButtonVariations }
					transition={ { type: 'tween' } }
				>
					<BackButton.Slot />
				</motion.div>
			) }
			<motion.div
				variants={ toolbarVariations }
				className="editor-header__toolbar"
				transition={ { type: 'tween' } }
			>
				{ toolbar }
			</motion.div>
			{ center && (
				<motion.div
					variants={ toolbarVariations }
					className="editor-header__center"
					transition={ { type: 'tween' } }
				>
					{ center }
				</motion.div>
			) }
			<motion.div
				variants={ toolbarVariations }
				transition={ { type: 'tween' } }
				className="editor-header__settings"
			>
				{ settings }
			</motion.div>
		</div>
	);
}
