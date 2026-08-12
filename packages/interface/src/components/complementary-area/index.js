import clsx from 'clsx';
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
import {
	cloneElement,
	isValidElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as viewportStore } from '@wordpress/viewport';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	useReducedMotion,
	useViewportMatch,
	usePrevious,
} from '@wordpress/compose';
import { usePluginContext } from '@wordpress/plugins';
import ComplementaryAreaHeader from '../complementary-area-header';
import ComplementaryAreaMoreMenuItem from '../complementary-area-more-menu-item';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import PinnedItems from '../pinned-items';
import { store as interfaceStore } from '../../store';

const ANIMATION_DURATION = 0.3;

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

const variants = {
	// `auto` leaves the width to the area's own stylesheet, so it stays in one
	// place. framer-motion measures the element to animate, then restores
	// `auto`.
	open: { width: 'auto' },
	// Resolved with the `custom` value passed to `AnimatePresence`, which is
	// the only way an already removed element can be given a fresh transition.
	closed: ( transition ) => ( { width: 0, transition } ),
};

/**
 * Renders the complementary area container, replacing the default `div` with
 * the element given via the `render` prop.
 *
 * `className` and `style` are composed rather than overwritten, since the
 * container is also the scroll container for the sidebar.
 *
 * @param {Object} [render] Replacement element.
 * @param {Object} props    Props for the container.
 */
function renderContainer( render, props ) {
	if ( isValidElement( render ) ) {
		return cloneElement( render, {
			...props,
			className: clsx( render.props.className, props.className ),
			style: { ...render.props.style, ...props.style },
		} );
	}

	return <div { ...props } />;
}

function ComplementaryAreaFill( {
	activeArea,
	isActive,
	scope,
	children,
	className,
	id,
	render,
} ) {
	const disableMotion = useReducedMotion();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	// Swapping one open area straight for another should not animate.
	const previousActiveArea = usePrevious( activeArea );
	const isSwitchingAreas =
		!! previousActiveArea &&
		!! activeArea &&
		activeArea !== previousActiveArea;
	const transition = {
		type: 'tween',
		duration:
			disableMotion || isMobileViewport || isSwitchingAreas
				? 0
				: ANIMATION_DURATION,
		ease: [ 0.6, 0, 0.4, 1 ],
	};

	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<AnimatePresence initial={ false } custom={ transition }>
				{ isActive && (
					<motion.div
						variants={ variants }
						initial="closed"
						animate="open"
						exit="closed"
						transition={ transition }
						className="interface-complementary-area__fill"
					>
						{ renderContainer( render, {
							id,
							className,
							children,
						} ) }
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
	render,
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
					identifier={ identifier }
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
				render={ render }
			>
				<ComplementaryAreaHeader
					className={ headerClassName }
					closeLabel={ closeLabel }
					onClose={ () => disableComplementaryArea( scope ) }
					toggleButtonProps={ {
						label: closeLabel,
						size: 'compact',
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
