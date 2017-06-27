/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';

registerBlockType( 'core/archives', {
	title: __( 'Archives' ),

	icon: 'calendar-alt',

	category: 'widgets',

	defaultAttributes: {
		count: true,
		dropdown: false,
	},

	edit( { attributes, setAttributes, focus } ) {
		const { count, dropdown } = attributes;
		const toggleCount = () => setAttributes( { count: ! count } );
		const toggleDropdown = () => setAttributes( { dropdown: ! dropdown } );
		return [
			focus && (
				<InspectorControls key="inspector">
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ !! count }
						onChange={ toggleCount }
					/>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ !! dropdown }
						onChange={ toggleDropdown }
					/>
				</InspectorControls>
			),
			<Placeholder
				icon="update"
				key="placeholder"
				label={ __( 'Loading archives, please wait' ) }
			>
			</Placeholder>,
		];
	},

	save() {
		return null;
	},
} );
