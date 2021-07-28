/**
 * External dependencies
 */
import { boolean } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';
import { Flex } from '../../../flex';

export default {
	component: ColorPicker,
	title: 'Components (Experimental)/ColorPicker',
};

const Example = () => {
	const [ color, setColor ] = useState( '#fff' );
	const props = {
		disableAlpha: boolean( 'disableAlpha', true ),
	};

	return (
		<Flex gap={ 8 } align="flex-start">
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
		</Flex>
	);
};

export const _default = () => {
	return <Example />;
};
