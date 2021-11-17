/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Divider } from '..';

export default {
	component: Divider,
	title: 'Components (Experimental)/Divider',
	parameters: {
		knobs: { disabled: false },
	},
};

// make the border color black to give higher contrast and help it appear in storybook better
const BlackDivider = styled( Divider )`
	border-color: #000;
`;

const VerticalWrapper = styled.div`
	display: flex;
	align-items: stretch;
	justify-content: start;
`;

export const Horizontal = () => {
	const props = {
		margin: number( 'margin', 2 ),
		marginStart: number( 'marginStart', undefined ),
		marginEnd: number( 'marginEnd', undefined ),
	};
	return (
		<div>
			<Text>Some text before the divider</Text>
			<BlackDivider { ...props } />
			<Text>Some text after the divider</Text>
		</div>
	);
};

export const Vertical = () => {
	const props = {
		margin: number( 'margin', 2 ),
		marginStart: number( 'marginStart', undefined ),
		marginEnd: number( 'marginEnd', undefined ),
	};
	return (
		<VerticalWrapper>
			<Text>Some text before the divider</Text>
			<BlackDivider orientation="vertical" { ...props } />
			<Text>Some text after the divider</Text>
		</VerticalWrapper>
	);
};
