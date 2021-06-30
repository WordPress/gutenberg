/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Divider } from '..';

export default {
	component: Divider,
	title: 'Components (Experimental)/Divider',
};

const BlackDivider = ( props ) => (
	<Divider { ...props } style={ { borderColor: 'black' } } />
);

export const _default = () => {
	const props = {
		margin: number( 'margin', 0 ),
	};
	// make the border color black to give higher contrast and help it appear in storybook better
	return <BlackDivider { ...props } />;
};

export const splitMargins = () => {
	const props = {
		marginTop: number( 'marginTop', 0 ),
		marginBottom: number( 'marginBottom', 0 ),
	};

	return <BlackDivider { ...props } />;
};
