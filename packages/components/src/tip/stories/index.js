/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Tip from '../';

export default {
	title: 'Components/Tip',
	component: Tip,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const tipText = text( 'Text', 'An example tip' );
	return (
		<Tip>
			<p>{ tipText }</p>
		</Tip>
	);
};
