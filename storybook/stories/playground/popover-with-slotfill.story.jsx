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

/**
 * Cross-iframe `@wordpress/ui` `Popover` whose popup renders in the parent
 * document via `SlotFillProvider` + `Slot` from `@wordpress/components`.
 * Mirrors the legacy Popover's `WithSlotOutsideIframe` pattern: the `Slot`
 * exposes a parent-document element, and its forwarded ref is passed to
 * `Popover.Portal`'s `container` prop (via `Popover.Popup`'s `portal` prop).
 *
 * Lives in the cross-library playground rather than `@wordpress/ui`'s own
 * Popover stories so the `@wordpress/ui` package doesn't depend on
 * `@wordpress/components` — keeping the package graph one-directional
 * (`components` → `ui`, never the reverse) and avoiding a TypeScript
 * project-reference cycle.
 *
 * Authored as `.jsx` to match the convention in
 * `storybook/stories/playground/`.
 */
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
