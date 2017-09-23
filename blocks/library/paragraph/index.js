/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { concatChildren } from '@wordpress/element';
import classnames from 'classnames';

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

	edit( { attributes, setAttributes, insertBlocksAfter, focus, setFocus, mergeBlocks, onReplace } ) {
		const { align, content, dropCap, placeholder, fontSize, backgroundColor, textColor, width } = attributes;
		const toggleDropCap = () => setAttributes( { dropCap: ! dropCap } );
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
					<h3>{ __( 'Text Settings' ) }</h3>
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
					<h3>{ __( 'Background Color' ) }</h3>
					<ColorPalette
						value={ backgroundColor }
						onChange={ ( colorValue ) => setAttributes( { backgroundColor: colorValue } ) }
						withTransparentOption
					/>
					<h3>{ __( 'Text Color' ) }</h3>
					<ColorPalette
						value={ textColor }
						onChange={ ( colorValue ) => setAttributes( { textColor: colorValue } ) }
					/>
					<h3>{ __( 'Block Alignment' ) }</h3>
					<BlockAlignmentToolbar
						value={ width }
						onChange={ ( nextWidth ) => setAttributes( { width: nextWidth } ) }
					/>
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
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
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
				/>
			</BlockAutocomplete>,
		];
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
