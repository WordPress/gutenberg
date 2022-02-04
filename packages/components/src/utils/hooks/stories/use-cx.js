/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { __unstableIframe as Iframe } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

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

const ExampleWithUseMemoWrong = ( { args, children } ) => {
	const cx = useCx();
	// Wrong: using 'useMemo' without adding 'cx' to the dependency list.
	const classes = useMemo( () => cx( ...args ), [ ...args ] );
	return <span className={ classes }>{ children }</span>;
};

const ExampleWithUseMemoRight = ( { args, children } ) => {
	const cx = useCx();
	// Right: using 'useMemo' with 'cx' listed as a dependency.
	const classes = useMemo( () => cx( ...args ), [ ...args, cx ] );
	return <span className={ classes }>{ children }</span>;
};

export const _slotFill = () => {
	const { Fill, Slot } = createSlotFill( 'UseCxExampleSlot' );

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

export const _slotFillSimple = () => {
	const { Fill, Slot } = createSlotFill( 'UseCxExampleSlotTwo' );

	const redText = css`
		color: red;
	`;

	return (
		<SlotFillProvider>
			<Iframe>
				<Fill name="test-slot">
					<Example args={ [ redText ] }>
						This text should be red
					</Example>
				</Fill>
			</Iframe>
			<Slot bubblesVirtually name="test-slot" />
		</SlotFillProvider>
	);
};

export const _useMemoBadPractices = () => {
	const redText = css`
		color: red;
	`;
	const blueText = css`
		color: blue;
	`;

	return (
		<>
			<Example args={ [ redText ] }>This text should be red</Example>
			<ExampleWithUseMemoRight args={ [ blueText ] }>
				This text should be blue
			</ExampleWithUseMemoRight>
			<Iframe>
				<Example args={ [ redText ] }>This text should be red</Example>
				<ExampleWithUseMemoWrong args={ [ blueText ] }>
					This text should be blue but it&apos;s not!
				</ExampleWithUseMemoWrong>
			</Iframe>
		</>
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
