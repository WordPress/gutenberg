/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

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
		'#f78da7',
		'#cf2e2e',
		'#ff6900',
		'#fcb900',
		'#7bdcb5',
		'#00d084',
		'#8ed1fc',
		'#0693e3',
		'#eee',
		'#abb8c3',
		'#313131',
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

export const withEditorSettings = ( mapSettingsToProps ) => ( Component ) => {
	return function WithSettingsComponent( props ) {
		return (
			<EditorSettings.Consumer>
				{ settings => (
					<Component
						{ ...props }
						{ ...( mapSettingsToProps ? mapSettingsToProps( settings, props ) : { settings } ) }
					/>
				) }
			</EditorSettings.Consumer>
		);
	};
};
