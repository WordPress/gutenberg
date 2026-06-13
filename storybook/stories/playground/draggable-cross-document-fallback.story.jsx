/**
 * WordPress dependencies
 */
import {
	Draggable,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { WithWpCompatOverlaySlot } from './with-wp-compat-overlay-slot';

export default {
	title: 'Playground/Debug fixtures/Draggable cross-document fallback',
	component: Draggable,
	decorators: [ WithWpCompatOverlaySlot ],
};

export const InsideIframeWithCompatSlot = () => {
	const iframeRef = useRef( null );
	const [ iframeDoc, setIframeDoc ] = useState( null );

	const updateIframeDoc = () => {
		setIframeDoc( iframeRef.current?.contentDocument ?? null );
	};

	useEffect( updateIframeDoc, [] );

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
				onLoad={ updateIframeDoc }
				srcDoc='<!doctype html><html><head></head><body style="margin:0;"></body></html>'
				style={ {
					border: '2px dashed #757575',
					height: 240,
					marginBlockStart: 80,
					marginInlineStart: 120,
					width: 360,
				} }
			/>
			{ iframeDoc?.body &&
				createPortal(
					<StyleProvider document={ iframeDoc }>
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
						</div>
					</StyleProvider>,
					iframeDoc.body
				) }
		</div>
	);
};
