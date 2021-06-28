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

export const _default = () => {
	const props = {
		margin: number( 'margin', undefined ),
		marginTop: number( 'marginTop', undefined ),
		marginBottom: number( 'marginBottom', undefined ),
	};
	// make the border color black to give higher contrast and help it appear in storybook better
	return <Divider { ...props } style={ { borderColor: 'black' } } />;
};
