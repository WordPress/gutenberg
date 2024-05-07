/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __unstableMotion as motion, Button } from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters( { __unstableContentRef } ) {
	const [ isReady, setIsReady ] = useState( false );
	const { setInserterIsOpened, insertionIndex } = useSelect(
		( select ) => {
			const { getSettings, getBlockIndex, getBlockCount } =
				select( blockEditorStore );
			const settings = getSettings();
			const index = getBlockIndex( clientId );
			const blockCount = getBlockCount();

			return {
				setInserterIsOpened: settings.__experimentalSetIsInserterOpened,
				insertionIndex: index === -1 ? blockCount : index,
			};
		},
		[ clientId ]
	);
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

	useEffect( () => {
		if ( setInserterIsOpened ) {
			setInserterIsOpened( false );
		}
	}, [ setInserterIsOpened ] );

	const disableMotion = useReducedMotion();

	if ( ! isReady ) {
		return null;
	}

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
	const patternInserterVariants = {
		start: {
			scale: disableMotion ? 1 : 0,
			translateX: '-50%',
			translateY: '-50%',
		},
		rest: {
			scale: 1,
			transition: { delay: 0.4, type: 'tween' },
		},
	};

	const label = _x(
		'Add pattern',
		'Generic label for pattern inserter button'
	);

	return [ undefined, ...blockOrder ].map( ( clientId, index ) => {
		if ( index === blockOrder.length - 1 ) {
			return null;
		}
		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index ] }
				__unstableContentRef={ __unstableContentRef }
				className="block-editor-button-pattern-inserter"
			>
				<motion.div
					key={ clientId }
					layout={ ! disableMotion }
					initial={ disableMotion ? 'rest' : 'start' }
					animate="rest"
					whileHover="hover"
					whileTap="pressed"
					exit="start"
					className="block-editor-block-list__insertion-point is-vertical is-pattern-inserter"
				>
					<motion.div
						variants={ lineVariants }
						className="block-editor-block-list__insertion-point-indicator"
						data-testid="block-list-insertion-point-indicator"
					/>
					<motion.div
						variants={ patternInserterVariants }
						className="block-editor-block-list__insertion-point-inserter"
					>
						<Button
							variant="primary"
							icon={ plus }
							size="compact"
							className="block-editor-button-pattern-inserter__button"
							onClick={ () => {
								setInserterIsOpened( {
									clientId,
									insertionIndex,
									filterValue,
								} );
							} }
							label={ label }
						/>
					</motion.div>
				</motion.div>
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
