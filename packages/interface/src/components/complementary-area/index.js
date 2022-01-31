/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Panel, Slot, Fill } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check, starEmpty, starFilled } from '@wordpress/icons';
import { useEffect, useRef } from '@wordpress/element';
import { store as viewportStore } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import ComplementaryAreaHeader from '../complementary-area-header';
import ComplementaryAreaMoreMenuItem from '../complementary-area-more-menu-item';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import withComplementaryAreaContext from '../complementary-area-context';
import PinnedItems from '../pinned-items';
import { store as interfaceStore } from '../../store';

function ComplementaryAreaSlot( { scope, ...props } ) {
	return <Slot name={ `ComplementaryArea/${ scope }` } { ...props } />;
}

function ComplementaryAreaFill( { scope, children, className } ) {
	return (
		<Fill name={ `ComplementaryArea/${ scope }` }>
			<div className={ className }>{ children }</div>
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
		interfaceStore
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
	name,
	smallScreenTitle,
	title,
	toggleShortcut,
	isActiveByDefault,
	showIconLabels = false,
	hideToggleToScreenReader,
} ) {
	const { isActive, isPinned, activeArea, isSmall, isLarge } = useSelect(
		( select ) => {
			const { getActiveComplementaryArea, isItemPinned } = select(
				interfaceStore
			);
			const _activeArea = getActiveComplementaryArea( scope );
			return {
				isActive: _activeArea === identifier,
				isPinned: isItemPinned( scope, identifier ),
				activeArea: _activeArea,
				isSmall: select( viewportStore ).isViewportMatch( '< medium' ),
				isLarge: select( viewportStore ).isViewportMatch( 'large' ),
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
		if ( isActiveByDefault && activeArea === undefined && ! isSmall ) {
			enableComplementaryArea( scope, identifier );
		}
	}, [ activeArea, isActiveByDefault, scope, identifier, isSmall ] );

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
							label={ title }
							icon={ showIconLabels ? check : icon }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							hideToggleToScreenReader={ hideToggleToScreenReader }
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
