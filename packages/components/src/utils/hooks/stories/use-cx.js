/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useState, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '..';
import StyleProvider from '../../../style-provider';
import {
	createSlotFill,
	Provider as SlotFillProvider,
} from '../../../slot-fill';

export default {
	title: 'Components (Experimental)/useCx',
};

const IFrame = ( { children } ) => {
	const [ iframeDocument, setIframeDocument ] = useState();

	const handleRef = ( node ) => {
		if ( ! node ) {
			return null;
		}

		function setIfReady() {
			const { contentDocument } = node;
			const { readyState } = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			setIframeDocument( contentDocument );
		}

		if ( setIfReady() ) {
			return;
		}

		node.addEventListener( 'load', () => {
			// iframe isn't immediately ready in Firefox
			setIfReady();
		} );
	};

	return (
		<iframe ref={ handleRef } title="use-cx-test-frame">
			{ iframeDocument &&
				createPortal(
					<StyleProvider document={ iframeDocument }>
						{ children }
					</StyleProvider>,
					iframeDocument.body
				) }
		</iframe>
	);
};

const Example = ( { args, children } ) => {
	const cx = useCx();
	const classes = cx( ...args );
	return <span className={ classes }>{ children }</span>;
};

export const _slotfill = () => {
	const { Fill, Slot } = createSlotFill( 'ToolsPanelSlot' );

	const redText = css`
		color: red;
	`;
	const blueText = css`
		color: blue;
	`;
	const greenText = css`
		color: green;
	`;

	return (
		<SlotFillProvider>
			<StyleProvider document={ document }>
				<IFrame>
					<IFrame>
						<Example args={ [ redText ] }>
							This text is inside an iframe and should be red
						</Example>
						<Fill name="test-slot">
							<Example args={ [ blueText ] }>
								This text is also inside the iframe, but is
								relocated by a slot/fill and should be blue
							</Example>
						</Fill>
						<Fill name="outside-frame">
							<Example args={ [ greenText ] }>
								This text is also inside the iframe, but is
								relocated by a slot/fill and should be green
							</Example>
						</Fill>
					</IFrame>
					<StyleProvider document={ document }>
						<Slot name="test-slot" />
					</StyleProvider>
				</IFrame>
				<Slot name="outside-frame" />
			</StyleProvider>
		</SlotFillProvider>
	);
};

export const _default = () => {
	const redText = css`
		color: red;
	`;
	return (
		<IFrame>
			<Example args={ [ redText ] }>
				This text is inside an iframe and is red!
			</Example>
		</IFrame>
	);
};
