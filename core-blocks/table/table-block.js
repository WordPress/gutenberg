/**
 * External dependencies
 */
import { find, parseInt, isEmpty } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	Toolbar,
	DropdownMenu,
	FontSizePicker,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
	ContrastChecker,
	InspectorControls,
	PanelColor,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { domToFormat } from '../../editor/components/rich-text/format';

function isTableSelected( editor ) {
	return editor.dom.getParent(
		editor.selection.getStart( true ),
		'table',
		editor.getBody().parentNode
	);
}

function selectFirstCell( editor ) {
	const cell = editor.getBody().querySelector( 'td,th' );
	if ( cell ) {
		cell.focus();
		editor.selection.select( cell, true );
		editor.selection.collapse( false );
	}
}

function execCommand( command ) {
	return ( editor ) => {
		if ( editor ) {
			if ( ! isTableSelected( editor ) ) {
				selectFirstCell( editor );
			}
			editor.execCommand( command );
		}
	};
}

const TABLE_CONTROLS = [
	{
		icon: 'table-row-before',
		title: __( 'Add Row Before' ),
		onClick: execCommand( 'mceTableInsertRowBefore' ),
	},
	{
		icon: 'table-row-after',
		title: __( 'Add Row After' ),
		onClick: execCommand( 'mceTableInsertRowAfter' ),
	},
	{
		icon: 'table-row-delete',
		title: __( 'Delete Row' ),
		onClick: execCommand( 'mceTableDeleteRow' ),
	},
	{
		icon: 'table-col-before',
		title: __( 'Add Column Before' ),
		onClick: execCommand( 'mceTableInsertColBefore' ),
	},
	{
		icon: 'table-col-after',
		title: __( 'Add Column After' ),
		onClick: execCommand( 'mceTableInsertColAfter' ),
	},
	{
		icon: 'table-col-delete',
		title: __( 'Delete Column' ),
		onClick: execCommand( 'mceTableDeleteCol' ),
	},
];

const FONT_SIZES = [
	{
		name: 'small',
		shortName: 'S',
		size: 14,
	},
	{
		name: 'regular',
		shortName: 'M',
		size: 16,
	},
	{
		name: 'large',
		shortName: 'L',
		size: 36,
	},
	{
		name: 'larger',
		shortName: 'XL',
		size: 48,
	},
];

export default class TableBlock extends Component {
	constructor() {
		super( ...arguments );
		this.handleSetup = this.handleSetup.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
		this.setBorderColor = this.setBorderColor.bind( this );
		this.updateTableCellStyle = this.updateTableCellStyle.bind( this );
		this.state = {
			editor: null,
		};
	}

	handleSetup( editor ) {
		const { isSelected } = this.props;

		// select the end of the first table cell
		editor.on( 'init', () => {
			if ( isSelected ) {
				selectFirstCell( editor );
			}
		} );

		// Update the alignment toolbar, font size, text and background color
		// value for the current table cell.
		editor.on( 'nodechange', ( { selectionChange, parents } ) => {
			if ( document.activeElement !== editor.getBody() ) {
				return;
			}

			if ( selectionChange ) {
				const selectedCell = find( parents, ( node ) => node.tagName === 'TD' || node.tagName === 'TH' );
				const {
					textAlign,
					borderColor,
					fontSize,
					color,
					backgroundColor,
				} = selectedCell ? selectedCell.style : {};

				this.setFontSize( parseInt( fontSize ) );
				this.setState( {
					textAlign,
					color: color ? tinycolor( color ).toHexString() : null,
					backgroundColor: backgroundColor ? tinycolor( backgroundColor ).toHexString() : null,
					borderColor: borderColor ? tinycolor( borderColor ).toHexString() : null,
				} );
			}
		} );

		this.setState( { editor } );
	}

	// Get the correct font size value using the font size data stored
	// in state.
	getFontSize() {
		const { customFontSize, fontSize } = this.state;

		if ( fontSize ) {
			const fontSizeObj = find( FONT_SIZES, { name: fontSize } );
			if ( fontSizeObj ) {
				return fontSizeObj.size;
			}
		}

		if ( customFontSize ) {
			return customFontSize;
		}
	}

	/**
	 * Save the correct font size value in state. If the font size is a
	 * defined in the `FONT_SIZES` constant, save the name of the font
	 * size instead.
	 *
	 * @param {number} fontSizeValue The numeric font size value.
	 */
	setFontSize( fontSizeValue ) {
		const thresholdFontSize = find( FONT_SIZES, { size: fontSizeValue } );

		if ( thresholdFontSize ) {
			this.setState( {
				fontSize: thresholdFontSize.name,
				customFontSize: undefined,
			} );
			return;
		}

		this.setState( {
			fontSize: undefined,
			customFontSize: fontSizeValue,
		} );
	}

	/**
	 * Sets the specified CSS property of the current table cell.
	 *
	 * @param {string} 					property					The CSS property name (camelcased).
	 * @param {(string|number)}	value 						The value to set.
	 * @param {boolean}					updateStateValue 	Whether to update the property value stored in state.
	 */
	updateTableCellStyle( property, value, updateStateValue = true ) {
		const { editor } = this.state;
		const { onChange } = this.props;
		const currentNode = editor.selection.getNode();
		const tableCell = editor.dom.getParent( currentNode, ( parentNode ) => parentNode.tagName === 'TD' || parentNode.tagName === 'TH' );

		if ( tableCell ) {
			// If `propertyValue` is undefined, set `propertyValue` to an empty
			// string in order to update both the CSS property on the current
			// table cell and the current state value.
			const propertyValue = value ? value : '';
			editor.dom.setStyle( tableCell, property, propertyValue );
			const content = domToFormat( editor.getBody().childNodes || [], 'element', editor );
			onChange( content );

			if ( updateStateValue ) {
				this.setState( { [ property ]: propertyValue } );
			}
		}
	}

	/**
	 * Set the border color for each table cell.
	 *
	 * @param {string} nextBorderColor The next border color value to set.
	 */
	setBorderColor( nextBorderColor ) {
		const { onChange } = this.props;
		const { editor } = this.state;
		const cells = editor.dom.select( 'td,th' );

		if ( ! isEmpty( cells ) ) {
			const borderColor = nextBorderColor ? nextBorderColor : '';
			editor.dom.setStyle( cells, 'border-color', borderColor );
			const content = domToFormat( editor.getBody().childNodes || [], 'element', editor );
			onChange( content );

			this.setState( { borderColor: nextBorderColor } );
		}
	}

	render() {
		const { content, onChange, className } = this.props;
		const { textAlign, color, backgroundColor, borderColor, editor } = this.state;
		const fontSize = this.getFontSize();

		return (
			<Fragment>
				<RichText
					tagName="table"
					wrapperClassName={ className }
					getSettings={ ( settings ) => ( {
						...settings,
						plugins: ( settings.plugins || [] ).concat( 'table' ),
						table_tab_navigation: false,
					} ) }
					style={ borderColor ? { borderColor } : null }
					onSetup={ ( currentEditor ) => this.handleSetup( currentEditor ) }
					onChange={ onChange }
					value={ content }
				/>
				<BlockControls>
					<Toolbar>
						<DropdownMenu
							icon="editor-table"
							label={ __( 'Edit Table' ) }
							controls={
								TABLE_CONTROLS.map( ( control ) => ( {
									...control,
									onClick: () => control.onClick( editor ),
								} ) ) }
						/>
					</Toolbar>
					<AlignmentToolbar
						value={ textAlign }
						onChange={ ( nextAlign ) => this.updateTableCellStyle( 'textAlign', nextAlign ) }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelColor
						colorValue={ borderColor }
						initialOpen={ false }
						title={ __( 'Border Color' ) }
						onChange={ this.setBorderColor }
					/>
					<PanelBody title={ __( 'Text Size' ) } className="blocks-font-size">
						<FontSizePicker
							fontSizes={ FONT_SIZES }
							value={ fontSize }
							onChange={ ( nextFontSize ) => {
								this.updateTableCellStyle( 'fontSize', nextFontSize, false );
								this.setFontSize( nextFontSize );
							} }
						/>
					</PanelBody>
					<PanelColor
						colorValue={ color }
						initialOpen={ false }
						title={ __( 'Text Color' ) }
						onChange={ ( nextTextColor ) => this.updateTableCellStyle( 'color', nextTextColor ) }
					/>
					<ContrastChecker
						textColor={ color }
						backgroundColor={ backgroundColor }
						isLargeText={ fontSize >= 18 }
					/>
					<PanelColor
						colorValue={ backgroundColor }
						initialOpen={ false }
						title={ __( 'Background Color' ) }
						onChange={ ( nextBackgroundColor ) => this.updateTableCellStyle( 'backgroundColor', nextBackgroundColor ) }
					/>
				</InspectorControls>
			</Fragment>
		);
	}
}
