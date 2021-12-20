/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Snackbar from './';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '../animation';

const SNACKBAR_VARIANTS = {
	init: {
		height: 0,
		opacity: 0,
	},
	open: {
		height: 'auto',
		opacity: 1,
		transition: {
			height: { stiffness: 1000, velocity: -100 },
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.5,
		},
	},
};

const SNACKBAR_REDUCE_MOTION_VARIANTS = {
	init: false,
	open: false,
	exit: false,
};

/**
 * Renders a list of notices.
 *
 * @param {Object}   $0           Props passed to the component.
 * @param {Array}    $0.notices   Array of notices to render.
 * @param {Function} $0.onRemove  Function called when a notice should be removed / dismissed.
 * @param {Object}   $0.className Name of the class used by the component.
 * @param {Object}   $0.children  Array of children to be rendered inside the notice list.
 *
 * @return {Object} The rendered notices list.
 */
function SnackbarList( { notices, className, children, onRemove = noop } ) {
	const listRef = useRef();
	const isReducedMotion = useReducedMotion();
	className = classnames( 'components-snackbar-list', className );
	const removeNotice = ( notice ) => () => onRemove( notice.id );
	return (
		<div className={ className } tabIndex={ -1 } ref={ listRef }>
			{ children }
			<AnimatePresence>
				{ notices.map( ( notice ) => {
					return (
						<motion.div
							layout={ ! isReducedMotion } //see https://www.framer.com/docs/animation/#layout-animations
							initial={ 'init' }
							animate={ 'open' }
							exit={ 'exit' }
							key={ notice.id }
							variants={
								isReducedMotion
									? SNACKBAR_REDUCE_MOTION_VARIANTS
									: SNACKBAR_VARIANTS
							}
						>
							<div className="components-snackbar-list__notice-container">
								<Snackbar
									{ ...omit( notice, [ 'content' ] ) }
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
