/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import ColorIndicator from '../';

export default {
	title: 'Components/ColorIndicator',
	component: ColorIndicator,
};

export const _default = () => {
	const color = text( 'Color', '#0073aa' );
	return <ColorIndicator colorValue={ color } />;
};
