/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { concatChildren } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType, source } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import ColorPalette from '../../color-palette';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

const { children, query } = source;

registerBlockType( 'core/cover-text', {
	title: __( 'Cover Text' ),

	icon: 'admin-customizer',

	category: 'formatting',

	keywords: [ __( 'colors' ) ],

	attributes: {
		align: {
			type: 'string',
		},
		width: {
			type: 'string',
		},
		content: {
			type: 'array',
			source: query( 'p', children() ),
		},
		dropCap: {
			type: 'boolean',
			default: false,
		},
		placeholder: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( 'wide' === width || 'full' === width ) {
			return { 'data-align': width };
		}
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, className, focus, setFocus, mergeBlocks } ) {
		const { align, width, content, dropCap, placeholder, textColor, backgroundColor } = attributes;
		const toggleDropCap = () => setAttributes( { dropCap: ! dropCap } );

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ width }
						onChange={ ( nextWidth ) => setAttributes( { width: nextWidth } ) }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => setAttributes( { align: nextAlign } ) }
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
					<h3>{ __( 'Background Color' ) }</h3>
					<ColorPalette
						color={ backgroundColor }
						onChange={ ( colorValue ) => setAttributes( { backgroundColor: colorValue.hex } ) }
					/>
					<h3>{ __( 'Text Color' ) }</h3>
					<ColorPalette
						color={ textColor }
						onChange={ ( colorValue ) => setAttributes( { textColor: colorValue.hex } ) }
					/>
				</InspectorControls>
			),
			<div className={ `${ className } align${ width }` } style={ { backgroundColor: backgroundColor, color: textColor } } key="block">
				<Editable
					tagName="p"
					value={ content }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					focus={ focus }
					onFocus={ setFocus }
					onMerge={ mergeBlocks }
					style={ { textAlign: align } }
					className={ dropCap && 'has-drop-cap' }
					placeholder={ placeholder || __( 'New Paragraph' ) }
				/>
			</div>,
		];
	},

	save( { attributes } ) {
		const { width, align, content, dropCap, backgroundColor, textColor } = attributes;
		const className = dropCap && 'has-drop-cap';
		const wrapperClassName = width && `align${ width }`;

		if ( ! align ) {
			return (
				<div className={ wrapperClassName } style={ { backgroundColor: backgroundColor, color: textColor } }>
					<p className={ className }>{ content }</p>
				</div>
			);
		}

		return (
			<div className={ wrapperClassName } style={ { backgroundColor: backgroundColor, color: textColor } }>
				<p style={ { textAlign: align } } className={ className }>{ content }</p>
			</div>
		);
	},
} );
