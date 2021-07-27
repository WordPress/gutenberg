/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit, noop } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Snackbar from './';

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
		x: -300,
		opacity: 0,
		transition: {
			x: { stiffness: 1000, velocity: -100 },
		},
	},
};

const SNACKBAR_REDUCE_MOTION_VARIANTS = {
	init: {
		opacity: 0,
	},
	open: {
		opacity: 1,
	},
	exit: {
		opacity: 0,
	},
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
	const isReducedMotion = useReducedMotion();
	className = classnames( 'components-snackbar-list', className );
	const removeNotice = ( notice ) => () => onRemove( notice.id );
	return (
		<div className={ className }>
			{ children }
			<AnimatePresence>
				{ notices.map( ( notice ) => {
					return (
						<motion.div
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
