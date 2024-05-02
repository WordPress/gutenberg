/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __unstableMotion as motion } from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters( { __unstableContentRef } ) {
	const [ isReady, setIsReady ] = useState( false );
	const blockOrder = useSelect( ( select ) => {
		const { sectionRootClientId } = unlock(
			select( blockEditorStore ).getSettings()
		);
		return select( blockEditorStore ).getBlockOrder( sectionRootClientId );
	}, [] );

	// Defer the initial rendering to avoid the jumps due to the animation.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setIsReady( true );
		}, 500 );
		return () => {
			clearTimeout( timeout );
		};
	}, [] );

	const toggleProps = {
		type: 'button',
		icon: undefined,
	};

	const disableMotion = useReducedMotion();
	const lineVariants = {
		// Initial position starts from the center and invisible.
		start: {
			opacity: 0,
			scale: 0,
		},
		// The line expands to fill the container. If the inserter is visible it
		// is delayed so it appears orchestrated.
		rest: {
			opacity: 1,
			scale: 1,
			transition: { delay: 0.5, type: 'tween' },
		},
		hover: {
			opacity: 1,
			scale: 1,
			transition: { delay: 0.5, type: 'tween' },
		},
	};
	const inserterVariants = {
		start: {
			scale: disableMotion ? 1 : 0,
		},
		rest: {
			scale: 1,
			transition: { delay: 0.4, type: 'tween' },
		},
	};

	if ( ! isReady ) {
		return null;
	}

	return blockOrder.map( ( clientId, index ) => {
		if ( index === blockOrder.length - 1 ) {
			return null;
		}
		return (
			<BlockPopoverInbetween
				key={ clientId }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index + 1 ] }
				__unstableContentRef={ __unstableContentRef }
			>
				<motion.div
					layout={ ! disableMotion }
					initial={ disableMotion ? 'rest' : 'start' }
					animate="rest"
					whileHover="hover"
					whileTap="pressed"
					exit="start"
					className="block-editor-block-list__insertion-point is-vertical is-with-inserter"
				>
					<motion.div
						variants={ lineVariants }
						className="block-editor-block-list__insertion-point-indicator"
						data-testid="block-list-insertion-point-indicator"
					/>

					<motion.div
						variants={ inserterVariants }
						className={ classnames(
							'block-editor-block-list__insertion-point-inserter'
						) }
					>
						<Inserter
							position="bottom center"
							clientId={ blockOrder[ index + 1 ] }
							__experimentalIsQuick
							{ ...toggleProps }
						/>
					</motion.div>
				</motion.div>
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
