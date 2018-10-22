/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';
import { Fill, KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { InserterListItem } from '../inserter-list-item';

function FillToolbarButton( { name, ...props } ) {
	return (
		<Fill name={ `RichText.ToolbarControls.${ name }` }>
			<ToolbarButton { ...props } />
		</Fill>
	);
}

function FillInserterListItem( props ) {
	return (
		<Fill name="Inserter.InlineElements">
			<InserterListItem { ...props } />
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
						ToolbarButton={ FillToolbarButton }
						InserterListItem={ FillInserterListItem }
						Shortcut={ Shortcut }
					/>
				);
			} ) }
		</Fragment>
	);
};

export default FormatEdit;
