/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';
import { Fill, KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import { normalizeTerm } from '../inserter/menu';

function isResult( { title, keywords = [] }, filterValue ) {
	const normalizedSearchTerm = normalizeTerm( filterValue );
	const matchSearch = ( string ) => normalizeTerm( string ).indexOf( normalizedSearchTerm ) !== -1;
	return matchSearch( title ) || keywords.some( matchSearch );
}

function FillToolbarButton( { name, shortcutType, shortcutCharacter, ...props } ) {
	let shortcut;

	if ( shortcutType && shortcutCharacter ) {
		shortcut = displayShortcut[ shortcutType ]( shortcutCharacter );
	}

	return (
		<Fill name={ `RichText.ToolbarControls.${ name }` }>
			<ToolbarButton
				{ ...props }
				shortcut={ shortcut }
			/>
		</Fill>
	);
}

function FillInserterListItem( props ) {
	return (
		<Fill name="Inserter.InlineElements">
			{ ( { filterValue } ) => {
				if ( filterValue && ! isResult( props, filterValue ) ) {
					return null;
				}

				return <InserterListItem { ...props } />;
			} }
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
			{ getFormatTypes().map( ( { name, edit: Edit, keywords } ) => {
				if ( ! Edit ) {
					return null;
				}

				const activeFormat = getActiveFormat( value, name );
				const isActive = activeFormat !== undefined;
				const activeAttributes = isActive ? activeFormat.attributes || {} : {};

				return (
					<Edit
						key={ name }
						isActive={ isActive }
						activeAttributes={ activeAttributes }
						value={ value }
						onChange={ onChange }
						ToolbarButton={ FillToolbarButton }
						InserterListItem={ ( props ) =>
							<FillInserterListItem
								keywords={ keywords }
								{ ...props }
							/>
						}
						Shortcut={ Shortcut }
					/>
				);
			} ) }
		</Fragment>
	);
};

export default FormatEdit;
