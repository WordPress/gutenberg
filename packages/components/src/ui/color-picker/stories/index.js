/**
 * External dependencies
 */
import { boolean } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';

export default {
	component: ColorPicker,
	title: 'Components (Experimental)/ColorPicker',
};

export const _default = () => {
	const props = {
		disableAlpha: boolean( 'disableAlpha', true ),
	};

	return (
		<div
			style={ {
				width: '100vw',
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			} }
		>
			<ColorPicker { ...props } />
		</div>
	);
};
