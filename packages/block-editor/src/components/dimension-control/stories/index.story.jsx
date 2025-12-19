/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DimensionControl from '../';

export default {
	component: DimensionControl,
	title: 'BlockEditor/DimensionControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<DimensionControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default = Template.bind( {} );

export const WithCustomLabel = Template.bind( {} );
WithCustomLabel.args = {
	label: 'Height',
};

export const WithWidthLabel = Template.bind( {} );
WithWidthLabel.args = {
	label: 'Width',
};

export const WithMinHeightLabel = Template.bind( {} );
WithMinHeightLabel.args = {
	label: 'Minimum height',
};

export const WithPresets = Template.bind( {} );
WithPresets.args = {
	label: 'Height with presets',
};

export const WithInitialValue = Template.bind( {} );
WithInitialValue.args = {
	label: 'Height',
	value: '24px',
};

const TemplateWithPresetValue = ( props ) => {
	const [ value, setValue ] = useState( 'var:preset|dimension|medium' );
	return (
		<DimensionControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const WithPresetValue = TemplateWithPresetValue.bind( {} );
WithPresetValue.args = {
	label: 'Height (preset value)',
};
