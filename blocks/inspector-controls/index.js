/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	CheckboxControl,
	Fill,
	RadioControl,
	RangeControl,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { deprecated } from '@wordpress/utils';

export default function InspectorControls( { children } ) {
	return (
		<Fill name="Inspector.Controls">
			{ children }
		</Fill>
	);
}

const withDeprecation = ( componentName ) => ( OriginalComponent ) => {
	class WrappedComponent extends Component {
		componentDidMount() {
			deprecated( `wp.blocks.InspectorControls.${ componentName }`, {
				version: '2.4',
				alternative: `wp.components.${ componentName }`,
				plugin: 'Gutenberg',
			} );
		}

		render() {
			return (
				<OriginalComponent { ...this.props } />
			);
		}
	}
	return WrappedComponent;
};

forEach(
	{
		BaseControl,
		CheckboxControl,
		RadioControl,
		RangeControl,
		SelectControl,
		TextControl,
		TextareaControl,
		ToggleControl,
	},
	( component, componentName ) => {
		InspectorControls[ componentName ] = withDeprecation( componentName )( component );
	}
);
