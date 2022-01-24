/**
 * External dependencies
 */
import { boolean, select } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';
import { Flex } from '../../flex';
import { Spacer } from '../../spacer';
import { space } from '../../ui/utils/space';

export default {
	component: ColorPicker,
	title: 'Components/ColorPicker',
	parameters: {
		knobs: { disable: false },
	},
};

const PROP_UNSET = 'unset';

const Example = () => {
	const [ color, setColor ] = useState( undefined );
	const props = {
		enableAlpha: boolean( 'enableAlpha', false ),
		copyFormat: select(
			'copyFormat',
			[ PROP_UNSET, 'rgb', 'hsl', 'hex' ],
			PROP_UNSET
		),
	};

	if ( props.copyFormat === PROP_UNSET ) {
		delete props.copyFormat;
	}

	return (
		<Flex
			as={ Spacer }
			gap={ space( 2 ) }
			justify="space-around"
			align="flex-start"
			marginTop={ space( 10 ) }
		>
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
			<div style={ { width: 200, textAlign: 'center' } }>{ color }</div>
			<ColorPicker { ...props } color={ color } onChange={ setColor } />
		</Flex>
	);
};

export const _default = () => {
	return <Example />;
};

const LegacyExample = () => {
	const [ legacyColor, setLegacyColor ] = useState( '#fff' );
	const legacyProps = {
		color: legacyColor,
		onChangeComplete: setLegacyColor,
		disableAlpha: boolean( 'disableAlpha', true ),
	};

	return (
		<Flex align="flex-start" justify="flex-start">
			<ColorPicker { ...legacyProps } />
			<pre style={ { width: '20em' } }>
				{ JSON.stringify( legacyColor, undefined, 4 ) }
			</pre>
		</Flex>
	);
};

export const legacy = () => <LegacyExample />;
