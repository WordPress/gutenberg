/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

/**
 * The default editor settings
 *
 *  alignWide         boolean        Enable/Disable Wide/Full Alignments
 *  colors            Array          Palette colors
 *  maxWidth          number         Max width to constraint resizing
 *  blockTypes        boolean|Array  Allowed block types
 *  hasFixedToolbar   boolean        Whether or not the editor toolbar is fixed
 */
const DEFAULT_SETTINGS = {
	alignWide: false,
	colors: [
		{
			name: 'pale pink',
			color: '#f78da7',
		},
		{	name: 'vivid red',
			color: '#cf2e2e',
		},
		{
			name: 'luminous vivid orange',
			color: '#ff6900',
		},
		{
			name: 'luminous vivid amber',
			color: '#fcb900',
		},
		{
			name: 'light green cyan',
			color: '#7bdcb5',
		},
		{
			name: 'vivid green cyan',
			color: '#00d084',
		},
		{
			name: 'pale cyan blue',
			color: '#8ed1fc',
		},
		{
			name: 'vivid cyan blue',
			color: '#0693e3',
		},
		{
			name: 'very light gray',
			color: '#eeeeee',
		},
		{
			name: 'cyan bluish gray',
			color: '#abb8c3',
		},
		{
			name: 'very dark gray',
			color: '#313131',
		},
	],

	// This is current max width of the block inner area
	// It's used to constraint image resizing and this value could be overriden later by themes
	maxWidth: 608,

	// Allowed block types for the editor, defaulting to true (all supported).
	allowedBlockTypes: true,
};

const EditorSettings = createContext( DEFAULT_SETTINGS );
EditorSettings.defaultSettings = DEFAULT_SETTINGS;

export default EditorSettings;

export const withEditorSettings = ( mapSettingsToProps ) => createHigherOrderComponent(
	( Component ) => {
		return function WithSettingsComponent( props ) {
			return (
				<EditorSettings.Consumer>
					{ ( settings ) => (
						<Component
							{ ...props }
							{ ...( mapSettingsToProps ? mapSettingsToProps( settings, props ) : { settings } ) }
						/>
					) }
				</EditorSettings.Consumer>
			);
		};
	},
	'withEditorSettings'
);
