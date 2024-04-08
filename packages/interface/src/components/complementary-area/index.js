/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { useEffect, useRef } from '@wordpress/element';
import { store as viewportStore } from '@wordpress/viewport';
import { store as preferencesStore } from '@wordpress/preferences';
import { useReducedMotion, useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ComplementaryAreaHeader from '../complementary-area-header';
import ComplementaryAreaMoreMenuItem from '../complementary-area-more-menu-item';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import withComplementaryAreaContext from '../complementary-area-context';
import PinnedItems from '../pinned-items';
import { store as interfaceStore } from '../../store';

const ANIMATION_DURATION = 0.2;

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

const SIDEBAR_WIDTH = 280;
const variants = {
	open: { width: SIDEBAR_WIDTH },
	closed: { width: 0 },
	mobileOpen: { width: '100vw' },
};

function ComplementaryAreaFill( { isActive, scope, children, className, id } ) {
	const disableMotion = useReducedMotion();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion || isMobileViewport ? 0 : ANIMATION_DURATION,
		ease: 'easeOut',
	};

	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<AnimatePresence initial={ false }>
				{ isActive && (
					<motion.div
						variants={ variants }
						initial="closed"
						animate={ isMobileViewport ? 'mobileOpen' : 'open' }
						exit="closed"
						transition={ defaultTransition }
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
	const previousIsSmall = useRef( false );
	const shouldOpenWhenNotSmall = useRef( false );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	useEffect( () => {
		// If the complementary area is active and the editor is switching from
		// a big to a small window size.
		if ( isActive && isSmall && ! previousIsSmall.current ) {
			disableComplementaryArea( scope );
			// Flag the complementary area to be reopened when the window size
			// goes from small to big.
			shouldOpenWhenNotSmall.current = true;
		} else if (
			// If there is a flag indicating the complementary area should be
			// enabled when we go from small to big window size and we are going
			// from a small to big window size.
			shouldOpenWhenNotSmall.current &&
			! isSmall &&
			previousIsSmall.current
		) {
			// Remove the flag indicating the complementary area should be
			// enabled.
			shouldOpenWhenNotSmall.current = false;
			enableComplementaryArea( scope, identifier );
		} else if (
			// If the flag is indicating the current complementary should be
			// reopened but another complementary area becomes active, remove
			// the flag.
			shouldOpenWhenNotSmall.current &&
			activeArea &&
			activeArea !== identifier
		) {
			shouldOpenWhenNotSmall.current = false;
		}
		if ( isSmall !== previousIsSmall.current ) {
			previousIsSmall.current = isSmall;
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
	identifier,
	header,
	headerClassName,
	icon,
	isPinnable = true,
	panelClassName,
	scope,
	name,
	smallScreenTitle,
	title,
	toggleShortcut,
	isActiveByDefault,
} ) {
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
	}, [
		activeArea,
		isActiveByDefault,
		scope,
		identifier,
		isSmall,
		enableComplementaryArea,
		disableComplementaryArea,
	] );

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
				isActive={ isActive }
				className={ classnames(
					'interface-complementary-area',
					className
				) }
				scope={ scope }
				id={ identifier.replace( '/', ':' ) }
			>
				<ComplementaryAreaHeader
					className={ headerClassName }
					closeLabel={ closeLabel }
					onClose={ () => disableComplementaryArea( scope ) }
					smallScreenTitle={ smallScreenTitle }
					toggleButtonProps={ {
						label: closeLabel,
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
							{ isPinnable && (
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

const ComplementaryAreaWrapped =
	withComplementaryAreaContext( ComplementaryArea );

ComplementaryAreaWrapped.Slot = ComplementaryAreaSlot;

export default ComplementaryAreaWrapped;
