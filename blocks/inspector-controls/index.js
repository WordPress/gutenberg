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
			// eslint-disable-next-line no-console
			console.warn( `wp.blocks.InspectorControls.${ componentName } is deprecated, use wp.components.${ componentName }.` );
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
