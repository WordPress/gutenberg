/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';
import { Fill } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';

let currentEditor;

function FillToolbarSlot( { name, children } ) {
	return (
		<Fill name={ `RichText.ToolbarControls.${ name }` }>
			{ children }
		</Fill>
	);
}

// To do: don't rely on editor instance.
class Shortcut extends Component {
	constructor( { type, character, onUse } ) {
		super( ...arguments );
		currentEditor.shortcuts.add( rawShortcut[ type ]( character ), '', () => {
			onUse();
		} );
	}

	render() {
		return null;
	}
}

const FormatEdit = ( { value, onChange, editor } ) => {
	currentEditor = editor;

	return (
		<Fragment>
			{ getFormatTypes().map( ( { name, edit: Edit }, i ) => {
				if ( ! Edit ) {
					return null;
				}

				const activeFormat = getActiveFormat( value, name );
				const isActive = activeFormat !== undefined;
				const activeAttributes = isActive ? activeFormat.attributes || {} : {};

				return (
					<Edit
						key={ i }
						isActive={ isActive }
						activeAttributes={ activeAttributes }
						value={ value }
						onChange={ onChange }
						FillToolbarSlot={ FillToolbarSlot }
						Shortcut={ Shortcut }
					/>
				);
			} ) }
		</Fragment>
	);
};

export default FormatEdit;
