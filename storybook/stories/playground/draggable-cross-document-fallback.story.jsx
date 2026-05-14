/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { WithWpCompatOverlaySlot } from './with-wp-compat-overlay-slot';
import draggableStyles from '../../../packages/components/src/draggable/style.scss?inline';

/**
 * Cross-document `Draggable` regression coverage: when the
 * `@wordpress/ui` compat overlay slot is enabled but lives in a different
 * document than the dragged element (slot in the parent document, drag
 * happens inside an iframe), `Draggable` falls back to its legacy
 * placement instead of routing the clone into the slot. This keeps the
 * clone's viewport-relative geometry in a single coordinate space.
 *
 * Lives in `storybook/stories/playground/` rather than next to the other
 * `Draggable` stories because the slot opt-in is a window-level flag
 * that's process-wide across the Storybook preview iframe. Co-locating
 * this story with `Default` / `AppendElementToOwnerDocument` would leak
 * the opt-in into those sibling stories on the shared autodocs page,
 * silently changing their placement behavior. Living in its own file
 * here keeps the leak blast-radius to this single story page.
 */
export default {
	title: 'Playground/Draggable cross-document fallback',
	component: Draggable,
	decorators: [ WithWpCompatOverlaySlot ],
	parameters: {
		sourceLink:
			'storybook/stories/playground/draggable-cross-document-fallback.story.jsx',
	},
};

export const InsideIframeWithCompatSlot = () => {
	const iframeRef = useRef( null );
	const [ iframeBody, setIframeBody ] = useState( null );

	const updateIframeBody = () => {
		const iframeDoc = iframeRef.current?.contentDocument;
		if (
			iframeDoc?.head &&
			! iframeDoc.getElementById( 'draggable-iframe-styles' )
		) {
			const styleEl = iframeDoc.createElement( 'style' );
			styleEl.id = 'draggable-iframe-styles';
			styleEl.textContent = draggableStyles;
			iframeDoc.head.appendChild( styleEl );
		}
		setIframeBody( iframeDoc?.body ?? null );
	};

	useEffect( updateIframeBody, [] );

	return (
		<div>
			<p>
				Drag the blue handle inside the iframe. The orange clone should
				appear under the cursor. If it appears offset toward the
				top-left of the Storybook canvas, the compat-slot cross-document
				fallback has regressed.
			</p>
			<p>
				<small>
					Compat slot present in this document:{ ' ' }
					<code>
						{ String(
							typeof window !== 'undefined' &&
								getWpCompatOverlaySlot() !== undefined
						) }
					</code>
				</small>
			</p>
			<iframe
				ref={ iframeRef }
				title="Draggable iframe coordinate test"
				onLoad={ updateIframeBody }
				srcDoc='<!doctype html><html><head></head><body style="margin:0;"></body></html>'
				style={ {
					border: '2px dashed #757575',
					height: 240,
					marginBlockStart: 80,
					marginInlineStart: 120,
					width: 360,
				} }
			/>
			{ iframeBody &&
				createPortal(
					<div
						style={ {
							background: '#f6f7f7',
							boxSizing: 'border-box',
							fontFamily: 'sans-serif',
							height: '240px',
							padding: 32,
						} }
					>
						<Draggable
							elementId="iframe-draggable-source"
							transferData={ {} }
							__experimentalDragComponent={
								<div
									style={ {
										background: '#f0b849',
										borderRadius: 4,
										color: '#1e1e1e',
										fontWeight: 600,
										padding: '8px 12px',
									} }
								>
									Drag clone
								</div>
							}
						>
							{ ( { onDraggableStart, onDraggableEnd } ) => (
								<div
									draggable
									onDragStart={ onDraggableStart }
									onDragEnd={ onDraggableEnd }
									style={ {
										alignItems: 'center',
										background: '#3858e9',
										borderRadius: 4,
										color: 'white',
										cursor: 'grab',
										display: 'inline-flex',
										fontWeight: 600,
										height: 56,
										justifyContent: 'center',
										padding: '0 16px',
									} }
								>
									Drag from iframe
								</div>
							) }
						</Draggable>
					</div>,
					iframeBody
				) }
		</div>
	);
};
InsideIframeWithCompatSlot.storyName = 'Inside iframe (compat slot fallback)';
