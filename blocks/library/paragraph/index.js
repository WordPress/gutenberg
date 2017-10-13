/**
 * External dependencies
 */
import classnames from 'classnames';
import uuid from 'uuid/v4';
import { find } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { concatChildren, Component } from '@wordpress/element';
import { PanelBody, IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, source, setDefaultBlockName } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import BlockControls from '../../block-controls';
import BlockAutocomplete from '../../block-autocomplete';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';
import ColorPalette from '../../color-palette';
import BlockDescription from '../../block-description';

const { children } = source;

registerBlockType( 'core/paragraph', {
	title: __( 'Paragraph' ),

	icon: 'editor-paragraph',

	category: 'common',

	keywords: [ __( 'text' ) ],

	className: false,

	attributes: {
		content: {
			type: 'array',
			source: children( 'p' ),
		},
		align: {
			type: 'string',
		},
		dropCap: {
			type: 'boolean',
			default: false,
		},
		placeholder: {
			type: 'string',
		},
		width: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
		fontSize: {
			type: 'number',
		},
		footnotes: {
			type: 'object',
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => (
					node.nodeName === 'P' &&
					// Do not allow embedded content.
					! node.querySelector( 'audio, canvas, embed, iframe, img, math, object, svg, video' )
				),
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( width ) !== -1 ) {
			return { 'data-align': width };
		}
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );

			this.state = { activeFormats: { }, activeFormatSettings: null, footnoteId: null };

			this.footnotes = this.props.attributes.footnotes || {};

			this.footnoteFormatter = {
				name: 'footnote',
				icon: 'format-audio',
				title: __( 'Footnote' ),
				onClick: () => {
					this.setState( { activeFormatSettings: 'footnote' } );
				},
				onNodeChange: ( parents ) => {
					const link = find( parents, ( node ) => node.nodeName.toLowerCase() === 'a' );
					const href = link && link.getAttribute( 'href' );
					const isFootnote = link && href && href.indexOf( '#footnote-' ) === 0;
					const footnoteId = isFootnote && href.substring( '#footnote-'.length );
					const activeFormats = { ...this.state.activeFormats, footnote: isFootnote };
					this.setState( { activeFormats, activeFormatSettings: isFootnote ? 'footnote' : ( this.state.activeFormatSettings === 'footnote' ? null : this.state.activeFormatSettings ), footnoteId } );
				},
				isActive: () => this.state.activeFormats.footnote,
				applyFormat: ( { setNodeContent }, formatValue ) => {
					const footnoteId = uuid();
					this.footnotes[ footnoteId ] = formatValue;
					setNodeContent( `<a href="#footnote-${ footnoteId }" contenteditable="false"><sup>[*]</sup></a>` );
				},
				getSettingsElement: () => this.state.activeFormatSettings === 'footnote' && <FootnoteSettings footnoteId={ this.state.footnoteId } footnote={ this.footnotes[ this.state.footnoteId ] } />,
			};
		}
		componentWillReceiveProps( { focus } ) {
			if ( ! focus ) {
				this.setState( { activeFormatSettings: null } );
			}
		}
		render() {
			const { attributes, setAttributes, insertBlocksAfter, focus, setFocus, mergeBlocks, onReplace } = this.props;
			const { align, content, dropCap, placeholder, fontSize, backgroundColor, textColor, width } = attributes;
			const toggleDropCap = () => setAttributes( { dropCap: ! dropCap } );
			const setContent = ( newContent ) => {
				setAttributes( { content: newContent, footnotes: this.footnotes } );
			};

			const className = dropCap ? 'has-drop-cap' : null;

			return [
				focus && (
					<BlockControls key="controls">
						<AlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
						/>
					</BlockControls>
				),
				focus && (
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'Text. Great things start here.' ) }</p>
						</BlockDescription>
					<PanelBody title={ __( 'Text Settings' ) }>
						<ToggleControl
							label={ __( 'Drop Cap' ) }
							checked={ !! dropCap }
							onChange={ toggleDropCap }
						/>
						<RangeControl
							label={ __( 'Font Size' ) }
							value={ fontSize || '' }
							onChange={ ( value ) => setAttributes( { fontSize: value } ) }
							min={ 10 }
							max={ 200 }
							beforeIcon="editor-textcolor"
							allowReset
						/>
					</PanelBody>
					<PanelBody title={ __( 'Background Color' ) }>
						<ColorPalette
							value={ backgroundColor }
							onChange={ ( colorValue ) => setAttributes( { backgroundColor: colorValue } ) }
							withTransparentOption
						/>
					</PanelBody>
					<PanelBody title={ __( 'Text Color' ) }>
						<ColorPalette
							value={ textColor }
							onChange={ ( colorValue ) => setAttributes( { textColor: colorValue } ) }
						/>
					</PanelBody>
					<PanelBody title={ __( 'Block Alignment' ) }>
						<BlockAlignmentToolbar
							value={ width }
							onChange={ ( nextWidth ) => setAttributes( { width: nextWidth } ) }
						/>
					</PanelBody>
					</InspectorControls>
				),
				<BlockAutocomplete key="editable" onReplace={ onReplace }>
					<Editable
						tagName="p"
						className={ classnames( 'wp-block-paragraph', className, {
							[ `align${ width }` ]: width,
							'has-background': backgroundColor,
						} ) }
						style={ {
							backgroundColor: backgroundColor,
							color: textColor,
							fontSize: fontSize ? fontSize + 'px' : undefined,
							textAlign: align,
						} }
						value={ content }
						onChange={ setContent }
						focus={ focus }
						onFocus={ setFocus }
						onSplit={ ( before, after, ...blocks ) => {
							setAttributes( { content: before } );
							insertBlocksAfter( [
								...blocks,
								createBlock( 'core/paragraph', { content: after } ),
							] );
						} }
						onMerge={ mergeBlocks }
						onReplace={ onReplace }
						placeholder={ placeholder || __( 'New Paragraph' ) }
						formatters={ { footnote: this.footnoteFormatter } }
					/>
				</BlockAutocomplete>,
			];
		}
	},

	save( { attributes } ) {
		const { width, align, content, dropCap, backgroundColor, textColor, fontSize } = attributes;
		const className = classnames( {
			[ `align${ width }` ]: width,
			'has-background': backgroundColor,
			'has-drop-cap': dropCap,
		} );
		const styles = {
			backgroundColor: backgroundColor,
			color: textColor,
			fontSize: fontSize,
			textAlign: align,
		};

		return <p style={ styles } className={ className ? className : undefined }>{ content }</p>;
	},
} );

setDefaultBlockName( 'core/paragraph' );

class FootnoteSettings extends Component {
	constructor( props ) {
		super( props );
		this.addFootnote = this.addFootnote.bind( this );
		this.onFootnoteChange = this.onFootnoteChange.bind( this );

		this.state = {
			footnote: props.footnote,
		};
	}
	componentWillReceiveProps( nextProps ) {
		if ( nextProps.footnoteId !== this.props.footnoteId ) {
			this.setState( { footnote: nextProps.footnote } );
		}
	}
	onFootnoteChange( e ) {
		this.setState( { footnote: e.target.value } );
	}
	addFootnote() {
		this.props.changeFormats( this.state.footnote );
	}
	render() {
		return [
			<textarea placeholder="Add a footnote" style={ { flexGrow: 1 } } value={ this.state.footnote } onChange={ this.onFootnoteChange } />,
			<IconButton icon="yes" label={ __( 'Add footnote' ) } onClick={ this.addFootnote } />,
		];
	}
}
