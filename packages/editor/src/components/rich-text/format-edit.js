/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';
import { Fill, KeyboardShortcuts } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';

function FillToolbarSlot( { name, children } ) {
	return (
		<Fill name={ `RichText.ToolbarControls.${ name }` }>
			{ children }
		</Fill>
	);
}

class Shortcut extends Component {
	constructor() {
		super( ...arguments );

		this.onUse = this.onUse.bind( this );
	}

	onUse() {
		this.props.onUse();
		return false;
	}

	render() {
		const { character, type } = this.props;

		return (
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ rawShortcut[ type ]( character ) ]: this.onUse,
				} }
			/>
		);
	}
}

const FormatEdit = ( { onChange, value } ) => {
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
