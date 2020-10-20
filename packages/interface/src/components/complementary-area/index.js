/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Animate, Button, Panel, Slot, Fill } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check, starEmpty, starFilled } from '@wordpress/icons';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ComplementaryAreaHeader from '../complementary-area-header';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import withComplementaryAreaContext from '../complementary-area-context';
import PinnedItems from '../pinned-items';

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

function ComplementaryAreaFill( { scope, children, className } ) {
	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<Animate type="slide-in" options={ { origin: 'left' } }>
				{ () => <div className={ className }>{ children }</div> }
			</Animate>
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
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		'core/interface'
	);
	useEffect( () => {
		// If the complementary area is active and the editor is switching from a big to a small window size.
		if ( isActive && isSmall && ! previousIsSmall.current ) {
			// Disable the complementary area.
			disableComplementaryArea( scope );
			// Flag the complementary area to be reopened when the window size goes from small to big.
			shouldOpenWhenNotSmall.current = true;
		} else if (
			// If there is a flag indicating the complementary area should be enabled when we go from small to big window size
			// and we are going from a small to big window size.
			shouldOpenWhenNotSmall.current &&
			! isSmall &&
			previousIsSmall.current
		) {
			// Remove the flag indicating the complementary area should be enabled.
			shouldOpenWhenNotSmall.current = false;
			// Enable the complementary area.
			enableComplementaryArea( scope, identifier );
		} else if (
			// If the flag is indicating the current complementary should be reopened but another complementary area becomes active,
			// remove the flag.
			shouldOpenWhenNotSmall.current &&
			activeArea &&
			activeArea !== identifier
		) {
			shouldOpenWhenNotSmall.current = false;
		}
		if ( isSmall !== previousIsSmall.current ) {
			previousIsSmall.current = isSmall;
		}
	}, [ isActive, isSmall, scope, identifier, activeArea ] );
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
	smallScreenTitle,
	title,
	toggleShortcut,
	isActiveByDefault,
	showIconLabels = false,
} ) {
	const { isActive, isPinned, activeArea, isSmall, isLarge } = useSelect(
		( select ) => {
			const { getActiveComplementaryArea, isItemPinned } = select(
				'core/interface'
			);
			const _activeArea = getActiveComplementaryArea( scope );
			return {
				isActive: _activeArea === identifier,
				isPinned: isItemPinned( scope, identifier ),
				activeArea: _activeArea,
				isSmall: select( 'core/viewport' ).isViewportMatch(
					'< medium'
				),
				isLarge: select( 'core/viewport' ).isViewportMatch( 'large' ),
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
	} = useDispatch( 'core/interface' );

	useEffect( () => {
		if ( isActiveByDefault && activeArea === undefined && ! isSmall ) {
			enableComplementaryArea( scope, identifier );
		}
	}, [ activeArea, isActiveByDefault, scope, identifier, isSmall ] );

	return (
		<>
			{ isPinned && isPinnable && (
				<PinnedItems scope={ scope }>
					<ComplementaryAreaToggle
						scope={ scope }
						identifier={ identifier }
						isPressed={
							isActive && ( ! showIconLabels || isLarge )
						}
						aria-expanded={ isActive }
						label={ title }
						icon={ showIconLabels ? check : icon }
						showTooltip={ ! showIconLabels }
						isTertiary={ showIconLabels }
					/>
				</PinnedItems>
			) }
			{ isActive && (
				<ComplementaryAreaFill
					className={ classnames(
						'interface-complementary-area',
						className
					) }
					scope={ scope }
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
								<strong>{ title }</strong>
								{ isPinnable && (
									<Button
										className="interface-complementary-area__pin-unpin-item"
										icon={
											isPinned ? starFilled : starEmpty
										}
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
			) }
		</>
	);
}

const ComplementaryAreaWrapped = withComplementaryAreaContext(
	ComplementaryArea
);

ComplementaryAreaWrapped.Slot = ComplementaryAreaSlot;

export default ComplementaryAreaWrapped;
