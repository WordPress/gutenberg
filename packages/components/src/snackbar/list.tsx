/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';
import classnames from 'classnames';
import { omit } from 'lodash';

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
import type { Notice, SnackbarListProps } from './types';

const noop = () => {};
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
	init: {},
	open: {},
	exit: {},
};

function SnackbarList( {
	notices,
	className,
	children,
	onRemove = noop,
}: SnackbarListProps ) {
	const listRef = useRef() as MutableRefObject< HTMLDivElement >;
	const isReducedMotion = useReducedMotion();
	className = classnames( 'components-snackbar-list', className );
	const removeNotice = ( notice: Notice ) => () => onRemove( notice.id );
	return (
		<div className={ className } tabIndex={ -1 } ref={ listRef }>
			{ children }
			<AnimatePresence>
				{ notices.map( ( notice ) => {
					return (
						<motion.div
							layout={ ! isReducedMotion } // See https://www.framer.com/docs/animation/#layout-animations
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
