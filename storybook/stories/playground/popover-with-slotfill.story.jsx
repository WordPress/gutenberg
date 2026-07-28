/**
 * WordPress dependencies
 */
import { createPortal, useState } from '@wordpress/element';
import { SlotFillProvider, Slot } from '@wordpress/components';
import { Popover } from '@wordpress/ui';

export default {
	title: 'Playground/Debug fixtures/Popover with SlotFill',
	component: Popover.Root,
};

// Renders an iframe and portals `children` into its body on `load`.
// Gating on `load` avoids a Firefox-only React portal bug:
// https://github.com/facebook/react/issues/22847#issuecomment-991394558
function IframePortal( { children, iframeRef, ...iframeProps } ) {
	const [ bodyNode, setBodyNode ] = useState( null );
	return (
		<iframe
			title="Iframe"
			{ ...iframeProps }
			ref={ iframeRef }
			srcDoc="<!doctype html><html><body></body></html>"
			onLoad={ ( event ) => {
				setBodyNode(
					event.currentTarget.contentDocument?.body ?? null
				);
			} }
		>
			{ bodyNode && createPortal( children, bodyNode ) }
		</iframe>
	);
}

export const CrossIframeWithSlotFill = {
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		const [ slotNode, setSlotNode ] = useState( null );
		const [ iframeBoundary, setIframeBoundary ] = useState( null );

		return (
			<SlotFillProvider>
				<Slot
					name="popover-container"
					bubblesVirtually
					ref={ setSlotNode }
				/>
				<IframePortal
					iframeRef={ setIframeBoundary }
					style={ {
						width: '100%',
						height: 400,
						border: 0,
						outline: '1px solid purple',
					} }
				>
					<div style={ { height: '200vh', paddingTop: '10vh' } }>
						<div
							style={ {
								maxWidth: 200,
								marginTop: 100,
								marginInline: 'auto',
							} }
						>
							<Popover.Root { ...args }>
								<Popover.Trigger
									style={ {
										padding: 8,
										background: 'salmon',
									} }
								>
									Popover&apos;s anchor (inside iframe)
								</Popover.Trigger>
								<Popover.Popup
									portal={
										<Popover.Portal
											container={ slotNode ?? undefined }
										/>
									}
									positioner={
										<Popover.Positioner
											collisionBoundary={
												iframeBoundary ?? undefined
											}
										/>
									}
								>
									<Popover.Arrow />
									<Popover.Title
										style={ {
											marginBottom:
												'var(--wpds-dimension-gap-xs)',
										} }
									>
										Cross-Iframe (SlotFill)
									</Popover.Title>
									<Popover.Description>
										This popup renders in the parent
										document via a `Slot` from
										`@wordpress/components`.
									</Popover.Description>
								</Popover.Popup>
							</Popover.Root>
						</div>
					</div>
				</IframePortal>
			</SlotFillProvider>
		);
	},
};
