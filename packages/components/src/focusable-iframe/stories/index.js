/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import FocusableIframe from '../';

export default {
	title: 'Components/FocusableIframe',
	component: FocusableIframe,
};

export const _default = () => {
	const source = text( 'iFrame Source', './' );
	return <FocusableIframe src={ source } />;
};
