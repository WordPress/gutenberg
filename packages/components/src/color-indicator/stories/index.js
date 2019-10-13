/**
 * Internal dependencies
 */
import ColorIndicator from '../';

export default {
	title: 'Color Indicator',
	component: ColorIndicator,
	source: true,
	parameters: {
		info: 'Default notes',
	},
};

export const _default = () => (
	<ColorIndicator colorValue="#0073AA" />
);

_default.story = {
	parameters: {
		info: 'Color indicator using WordPress blue #0073AA',
	},
};
