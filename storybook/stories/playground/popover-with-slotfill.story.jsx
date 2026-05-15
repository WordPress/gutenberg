/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { SlotFillProvider, Slot } from '@wordpress/components';

/**
 * Internal dependencies
 */
import * as Popover from '../../../packages/ui/src/popover';
import { GenericIframe } from '../../../packages/ui/src/popover/stories/utils';

export default {
	title: 'Playground/Popover with SlotFill',
	component: Popover.Root,
	parameters: {
		sourceLink:
			'storybook/stories/playground/popover-with-slotfill.story.jsx',
	},
};

export const CrossIframeWithSlotFill = {
	name: 'Cross-Iframe (SlotFill)',
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		const slotRef = useRef( null );
		const [ iframeBoundary, setIframeBoundary ] = useState( null );

		return (
			<SlotFillProvider>
				<Slot
					name="popover-container"
					bubblesVirtually
					ref={ slotRef }
				/>
				<GenericIframe
					ref={ setIframeBoundary }
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
										<Popover.Portal container={ slotRef } />
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
				</GenericIframe>
			</SlotFillProvider>
		);
	},
};
