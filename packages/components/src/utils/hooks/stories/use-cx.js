/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { __unstableIframe as Iframe } from '@wordpress/block-editor';

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
				<Iframe>
					<Iframe>
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
					</Iframe>
					<StyleProvider document={ document }>
						<Slot bubblesVirtually name="test-slot" />
					</StyleProvider>
				</Iframe>
				<Slot bubblesVirtually name="outside-frame" />
			</StyleProvider>
		</SlotFillProvider>
	);
};

export const _default = () => {
	const redText = css`
		color: red;
	`;
	return (
		<Iframe>
			<Example args={ [ redText ] }>
				This text is inside an iframe and is red!
			</Example>
		</Iframe>
	);
};
