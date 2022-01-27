/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { Text } from '../../text';
import { Divider } from '..';

export default {
	component: Divider,
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
			<Divider orientation="vertical" { ...args } />
			<Text>Some text after the divider</Text>
		</div>
	);
};

export const Horizontal = HorizontalTemplate.bind( {} );
Horizontal.args = {
	margin: 2,
	marginStart: undefined,
	marginEnd: undefined,
};

export const Vertical = VerticalTemplate.bind( {} );
Vertical.args = {
	...Horizontal.args,
};
