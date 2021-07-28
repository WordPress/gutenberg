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
import { Spacer } from '../../../spacer';
import { space } from '../../utils/space';

export default {
	component: ColorPicker,
	title: 'Components (Experimental)/ColorPicker',
};

const Example = () => {
	const [ color, setColor ] = useState( '#fff' );
	const props = {
		enableAlpha: boolean( 'enableAlpha', false ),
	};

	return (
		<Flex
			as={ Spacer }
			gap={ space( 2 ) }
			justify="space-around"
			align="flex-start"
			marginTop={ space( 10 ) }
		>
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
		</Flex>
	);
};

export const _default = () => {
	return <Example />;
};
