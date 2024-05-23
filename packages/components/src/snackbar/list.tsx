/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Snackbar from '.';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '../animation';
import type { SnackbarListProps } from './types';
import type { WordPressComponentProps } from '../context';

const SNACKBAR_VARIANTS = {
	init: {
		height: 0,
		opacity: 0,
	},
	open: {
		height: 'auto',
		opacity: 1,
		transition: {
			height: { type: 'tween', duration: 0.3, ease: [ 0, 0, 0.2, 1 ] },
			opacity: {
				type: 'tween',
				duration: 0.25,
				delay: 0.05,
				ease: [ 0, 0, 0.2, 1 ],
			},
		},
	},
	exit: {
		opacity: 0,
		transition: {
			type: 'tween',
			duration: 0.1,
			ease: [ 0, 0, 0.2, 1 ],
		},
	},
};

/**
 * Renders a list of notices.
 *
 * ```jsx
 * const MySnackbarListNotice = () => (
 *   <SnackbarList
 *     notices={ notices }
 *     onRemove={ removeNotice }
 *   />
 * );
 * ```
 */
export function SnackbarList( {
	notices,
	className,
	children,
	onRemove,
}: WordPressComponentProps< SnackbarListProps, 'div' > ) {
	const listRef = useRef< HTMLDivElement | null >( null );
	const isReducedMotion = useReducedMotion();
	className = clsx( 'components-snackbar-list', className );
	const removeNotice =
		( notice: SnackbarListProps[ 'notices' ][ number ] ) => () =>
			onRemove?.( notice.id );
	return (
		<div
			className={ className }
			tabIndex={ -1 }
			ref={ listRef }
			data-testid="snackbar-list"
		>
			{ children }
			<AnimatePresence>
				{ notices.map( ( notice ) => {
					const { content, ...restNotice } = notice;

					return (
						<motion.div
							layout={ ! isReducedMotion } // See https://www.framer.com/docs/animation/#layout-animations
							initial={ 'init' }
							animate={ 'open' }
							exit={ 'exit' }
							key={ notice.id }
							variants={
								isReducedMotion ? undefined : SNACKBAR_VARIANTS
							}
						>
							<div className="components-snackbar-list__notice-container">
								<Snackbar
									{ ...restNotice }
									onRemove={ removeNotice( notice ) }
									listRef={ listRef }
								>
									{ notice.content }
								</Snackbar>
							</div>
						</motion.div>
					);
				} ) }
			</AnimatePresence>
		</div>
	);
}

export default SnackbarList;
