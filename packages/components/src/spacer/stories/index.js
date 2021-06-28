/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Spacer } from '..';

export default {
	component: Spacer,
	title: 'Components (Experimental)/Spacer',
};

const PROPS = [
	'marginTop',
	'marginBottom',
	'marginLeft',
	'marginRight',
	'marginX',
	'marginY',
	'margin',

	'paddingTop',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
	'paddingX',
	'paddingY',
	'padding',
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
