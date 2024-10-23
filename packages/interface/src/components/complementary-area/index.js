/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Panel,
	Slot,
	Fill,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check, starEmpty, starFilled } from '@wordpress/icons';
import { useEffect, useRef, useState } from '@wordpress/element';
import { store as viewportStore } from '@wordpress/viewport';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	useReducedMotion,
	useViewportMatch,
	usePrevious,
} from '@wordpress/compose';
import { usePluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import ComplementaryAreaHeader from '../complementary-area-header';
import ComplementaryAreaMoreMenuItem from '../complementary-area-more-menu-item';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import PinnedItems from '../pinned-items';
import { store as interfaceStore } from '../../store';

const ANIMATION_DURATION = 0.3;

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

const SIDEBAR_WIDTH = 280;
const variants = {
	open: { width: SIDEBAR_WIDTH },
	closed: { width: 0 },
	mobileOpen: { width: '100vw' },
};

function ComplementaryAreaFill( {
	activeArea,
	isActive,
	scope,
	children,
	className,
	id,
} ) {
	const disableMotion = useReducedMotion();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	// This is used to delay the exit animation to the next tick.
	// The reason this is done is to allow us to apply the right transition properties
	// When we switch from an open sidebar to another open sidebar.
	// we don't want to animate in this case.
	const previousActiveArea = usePrevious( activeArea );
	const previousIsActive = usePrevious( isActive );
	const [ , setState ] = useState( {} );
	useEffect( () => {
		setState( {} );
	}, [ isActive ] );
	const transition = {
		type: 'tween',
		duration:
			disableMotion ||
			isMobileViewport ||
			( !! previousActiveArea &&
				!! activeArea &&
				activeArea !== previousActiveArea )
				? 0
				: ANIMATION_DURATION,
		ease: [ 0.6, 0, 0.4, 1 ],
	};

	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<AnimatePresence initial={ false }>
				{ ( previousIsActive || isActive ) && (
					<motion.div
						variants={ variants }
						initial="closed"
						animate={ isMobileViewport ? 'mobileOpen' : 'open' }
						exit="closed"
						transition={ transition }
						className="interface-complementary-area__fill"
					>
						<div
							id={ id }
							className={ className }
							style={ {
								width: isMobileViewport
									? '100vw'
									: SIDEBAR_WIDTH,
							} }
						>
							{ children }
						</div>
					</motion.div>
				) }
			</AnimatePresence>
		</Fill>
	);
}

function useAdjustComplementaryListener(
	scope,
	identifier,
	activeArea,
	isActive,
	isSmall
) {
	const previousIsSmallRef = useRef( false );
	const shouldOpenWhenNotSmallRef = useRef( false );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	useEffect( () => {
		// If the complementary area is active and the editor is switching from
		// a big to a small window size.
		if ( isActive && isSmall && ! previousIsSmallRef.current ) {
			disableComplementaryArea( scope );
			// Flag the complementary area to be reopened when the window size
			// goes from small to big.
			shouldOpenWhenNotSmallRef.current = true;
		} else if (
			// If there is a flag indicating the complementary area should be
			// enabled when we go from small to big window size and we are going
			// from a small to big window size.
			shouldOpenWhenNotSmallRef.current &&
			! isSmall &&
			previousIsSmallRef.current
		) {
			// Remove the flag indicating the complementary area should be
			// enabled.
			shouldOpenWhenNotSmallRef.current = false;
			enableComplementaryArea( scope, identifier );
		} else if (
			// If the flag is indicating the current complementary should be
			// reopened but another complementary area becomes active, remove
			// the flag.
			shouldOpenWhenNotSmallRef.current &&
			activeArea &&
			activeArea !== identifier
		) {
			shouldOpenWhenNotSmallRef.current = false;
		}
		if ( isSmall !== previousIsSmallRef.current ) {
			previousIsSmallRef.current = isSmall;
		}
	}, [
		isActive,
		isSmall,
		scope,
		identifier,
		activeArea,
		disableComplementaryArea,
		enableComplementaryArea,
	] );
}

function ComplementaryArea( {
	children,
	className,
	closeLabel = __( 'Close plugin' ),
	identifier: identifierProp,
	header,
	headerClassName,
	icon: iconProp,
	isPinnable = true,
	panelClassName,
	scope,
	name,
	title,
	toggleShortcut,
	isActiveByDefault,
} ) {
	const context = usePluginContext();
	const icon = iconProp || context.icon;
	const identifier = identifierProp || `${ context.name }/${ name }`;

	// This state is used to delay the rendering of the Fill
	// until the initial effect runs.
	// This prevents the animation from running on mount if
	// the complementary area is active by default.
	const [ isReady, setIsReady ] = useState( false );
	const {
		isLoading,
		isActive,
		isPinned,
		activeArea,
		isSmall,
		isLarge,
		showIconLabels,
	} = useSelect(
		( select ) => {
			const {
				getActiveComplementaryArea,
				isComplementaryAreaLoading,
				isItemPinned,
			} = select( interfaceStore );
			const { get } = select( preferencesStore );

			const _activeArea = getActiveComplementaryArea( scope );

			return {
				isLoading: isComplementaryAreaLoading( scope ),
				isActive: _activeArea === identifier,
				isPinned: isItemPinned( scope, identifier ),
				activeArea: _activeArea,
				isSmall: select( viewportStore ).isViewportMatch( '< medium' ),
				isLarge: select( viewportStore ).isViewportMatch( 'large' ),
				showIconLabels: get( 'core', 'showIconLabels' ),
			};
		},
		[ identifier, scope ]
	);

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	useAdjustComplementaryListener(
		scope,
		identifier,
		activeArea,
		isActive,
		isSmall
	);
	const {
		enableComplementaryArea,
		disableComplementaryArea,
		pinItem,
		unpinItem,
	} = useDispatch( interfaceStore );

	useEffect( () => {
		// Set initial visibility: For large screens, enable if it's active by
		// default. For small screens, always initially disable.
		if ( isActiveByDefault && activeArea === undefined && ! isSmall ) {
			enableComplementaryArea( scope, identifier );
		} else if ( activeArea === undefined && isSmall ) {
			disableComplementaryArea( scope, identifier );
		}
		setIsReady( true );
	}, [
		activeArea,
		isActiveByDefault,
		scope,
		identifier,
		isSmall,
		enableComplementaryArea,
		disableComplementaryArea,
	] );

	if ( ! isReady ) {
		return;
	}

	return (
		<>
			{ isPinnable && (
				<PinnedItems scope={ scope }>
					{ isPinned && (
						<ComplementaryAreaToggle
							scope={ scope }
							identifier={ identifier }
							isPressed={
								isActive && ( ! showIconLabels || isLarge )
							}
							aria-expanded={ isActive }
							aria-disabled={ isLoading }
							label={ title }
							icon={ showIconLabels ? check : icon }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							size="compact"
							shortcut={ toggleShortcut }
						/>
					) }
				</PinnedItems>
			) }
			{ name && isPinnable && (
				<ComplementaryAreaMoreMenuItem
					target={ name }
					scope={ scope }
					icon={ icon }
				>
					{ title }
				</ComplementaryAreaMoreMenuItem>
			) }
			<ComplementaryAreaFill
				activeArea={ activeArea }
				isActive={ isActive }
				className={ clsx( 'interface-complementary-area', className ) }
				scope={ scope }
				id={ identifier.replace( '/', ':' ) }
			>
				<ComplementaryAreaHeader
					className={ headerClassName }
					closeLabel={ closeLabel }
					onClose={ () => disableComplementaryArea( scope ) }
					toggleButtonProps={ {
						label: closeLabel,
						size: 'small',
						shortcut: toggleShortcut,
						scope,
						identifier,
					} }
				>
					{ header || (
						<>
							<h2 className="interface-complementary-area-header__title">
								{ title }
							</h2>
							{ isPinnable && ! isMobileViewport && (
								<Button
									className="interface-complementary-area__pin-unpin-item"
									icon={ isPinned ? starFilled : starEmpty }
									label={
										isPinned
											? __( 'Unpin from toolbar' )
											: __( 'Pin to toolbar' )
									}
									onClick={ () =>
										( isPinned ? unpinItem : pinItem )(
											scope,
											identifier
										)
									}
									isPressed={ isPinned }
									aria-expanded={ isPinned }
									size="compact"
								/>
							) }
						</>
					) }
				</ComplementaryAreaHeader>
				<Panel className={ panelClassName }>{ children }</Panel>
			</ComplementaryAreaFill>
		</>
	);
}

ComplementaryArea.Slot = ComplementaryAreaSlot;

export default ComplementaryArea;
