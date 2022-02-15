/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { Text } from '../../text';
import { Divider } from '../';
import { Divider as UnconnectedDivider } from '../component';

export default {
	component: UnconnectedDivider,
	title: 'Components (Experimental)/Divider',
	argTypes: {
		margin: {
			control: { type: 'number' },
		},
		marginStart: {
			control: { type: 'number' },
		},
		marginEnd: {
			control: { type: 'number' },
		},
		// TODO: This is a reakit internal prop. We can hide it from the props table like this
		// if we don't want to expose it, but should we rather omit it at the TypeScript level?
		unstable_system: {
			table: { disable: true },
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};

const HorizontalTemplate = ( args ) => (
	<div>
		<Text>Some text before the divider</Text>
		<Divider { ...args } />
		<Text>Some text after the divider</Text>
	</div>
);

const VerticalTemplate = ( args ) => {
	const cx = useCx();
	const wrapperClassName = cx( css`
		display: flex;
		align-items: stretch;
		justify-content: start;
	` );

	return (
		<div className={ wrapperClassName }>
			<Text>Some text before the divider</Text>
			<Divider { ...args } />
			<Text>Some text after the divider</Text>
		</div>
	);
};

export const Horizontal = HorizontalTemplate.bind( {} );
Horizontal.args = {
	margin: 2,
};

export const Vertical = VerticalTemplate.bind( {} );
Vertical.args = {
	...Horizontal.args,
	orientation: 'vertical',
};
