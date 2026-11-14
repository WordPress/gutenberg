import type { ComponentProps } from 'react';
import {
	Modal,
	Popover as WCPopover,
	SlotFillProvider,
} from '@wordpress/components';
import {
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { tabbable } from 'tabbable';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Migrate verified form and action dialogs while retaining the legacy contract.
	Dialog,
	VisuallyHidden,
} from '@wordpress/ui';

type Props = Pick<
	ComponentProps< typeof Modal >,
	| 'children'
	| 'title'
	| 'className'
	| 'overlayClassName'
	| 'size'
	| 'focusOnMount'
	| 'onRequestClose'
	| '__experimentalHideHeader'
> & { useUiOverlay: boolean };

/** Use a native host only for content whose owner declares compatibility. */
export default function CompatibleModal( {
	useUiOverlay,
	children,
	title,
	className,
	overlayClassName,
	size = 'medium',
	focusOnMount = true,
	onRequestClose,
	__experimentalHideHeader: hideHeader,
}: Props ) {
	const slotName = useId();
	const finalFocusRef = useRef< HTMLElement | null >( null );
	useEffect(
		() => () => {
			const target = finalFocusRef.current;
			const active = target?.ownerDocument.activeElement;
			// The session keeps its original opener when the overlay host changes.
			if (
				target?.isConnected &&
				( ! active?.isConnected ||
					active === target.ownerDocument.body )
			) {
				target.focus();
			}
		},
		[]
	);
	const setSource = useCallback( ( node: HTMLSpanElement | null ) => {
		if ( node && ! finalFocusRef.current ) {
			const active = node.ownerDocument.activeElement;
			if (
				active instanceof node.ownerDocument.defaultView!.HTMLElement
			) {
				finalFocusRef.current = active;
			}
		}
	}, [] );
	const [ nativeHost, setNativeHost ] = useState( useUiOverlay );
	if ( nativeHost && ! useUiOverlay ) {
		setNativeHost( false );
	}
	const frameFocusRef = useFocusOnMount(
		focusOnMount === 'firstContentElement' ? false : focusOnMount
	);
	const frameRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const mergedFrameRef = useMergeRefs( [ frameRef, frameFocusRef ] );
	if ( ! nativeHost || ! useUiOverlay ) {
		return (
			<Modal
				title={ title }
				className={ className }
				overlayClassName={ overlayClassName }
				size={ size }
				focusOnMount={ focusOnMount }
				onRequestClose={ onRequestClose }
				__experimentalHideHeader={ hideHeader }
			>
				{ children }
			</Modal>
		);
	}
	return (
		<SlotFillProvider passthrough>
			<span hidden ref={ setSource } />
			<WCPopover.__unstableSlotNameProvider value={ slotName }>
				<Dialog.Root
					open
					onOpenChange={ ( open ) => {
						if ( ! open ) {
							onRequestClose();
						}
					} }
				>
					<Dialog.Popup
						ref={ mergedFrameRef }
						finalFocus={ false }
						initialFocus={
							focusOnMount === 'firstContentElement'
								? () => {
										const frame = frameRef.current;
										if (
											frame?.contains(
												frame.ownerDocument
													.activeElement
											)
										) {
											return false;
										}
										const target =
											( contentRef.current &&
												tabbable(
													contentRef.current
												)[ 0 ] ) ||
											( frame &&
												tabbable( frame )[ 0 ] ) ||
											frame;
										// Base UI accepts HTML targets; SVG controls can still focus themselves.
										if (
											target &&
											! ( target instanceof HTMLElement )
										) {
											target.focus();
											return false;
										}
										return target;
									}
								: false
						}
						className={ className }
						size={ size === 'fill' ? 'full' : size }
						// Keep legacy slots outside the scrolling body without clipping flyouts.
						style={ { overflow: 'visible' } }
						portal={
							<Dialog.Portal className={ overlayClassName } />
						}
					>
						{ hideHeader ? (
							<VisuallyHidden render={ <Dialog.Title /> }>
								{ title }
							</VisuallyHidden>
						) : (
							<Dialog.Header>
								<Dialog.Title>{ title }</Dialog.Title>
								<Dialog.CloseIconButton />
							</Dialog.Header>
						) }
						<Dialog.Content ref={ contentRef }>
							{ children }
						</Dialog.Content>
						<WCPopover.Slot name={ slotName } />
					</Dialog.Popup>
				</Dialog.Root>
			</WCPopover.__unstableSlotNameProvider>
		</SlotFillProvider>
	);
}
