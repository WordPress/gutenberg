/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { Spacer } from '..';

export default {
	component: Spacer,
	title: 'Components (Experimental)/Spacer',
	parameters: {
		knobs: { disable: false },
	},
};

const PROPS = [
	'margin',
	'marginY',
	'marginX',
	'marginTop',
	'marginBottom',
	'marginLeft',
	'marginRight',

	'padding',
	'paddingY',
	'paddingX',
	'paddingTop',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
];

const BlackBox = () => (
	<div
		style={ { backgroundColor: 'black', width: '100px', height: '100px' } }
	/>
);

export const _default = () => {
	const props = PROPS.reduce(
		( acc, prop ) => ( { ...acc, [ prop ]: number( prop, undefined ) } ),
		{}
	);

	return (
		<>
			<BlackBox />
			<Spacer { ...props }>This is the spacer</Spacer>
			<BlackBox />
		</>
	);
};
