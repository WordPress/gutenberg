/**
 * External dependencies
 */
import { CirclePicker } from 'react-color';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { concatChildren } from 'element';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType, query as hpq } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

const { children, query } = hpq;

function palette() {
	return [
		'#f78da7',
		'#eb144c',
		'#ff6900',
		'#fcb900',
		'#7bdcb5',
		'#00d084',
		'#8ed1fc',
		'#0693e3',
		'#eee',
		'#abb8c3',
		'#444',
		'#111',
	];
}

registerBlockType( 'core/cover-text', {
	title: __( 'Cover Text' ),

	icon: 'admin-customizer',

	category: 'formatting',

	attributes: {
		content: query( 'p', children() ),
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
					<CirclePicker
						color={ backgroundColor }
						colors={ palette() }
						onChangeComplete={ ( colorValue ) => setAttributes( { backgroundColor: colorValue.hex } ) }
						style={ { marginBottom: '20px' } }
					/>
					<h3>{ __( 'Text Color' ) }</h3>
					<CirclePicker
						color={ textColor }
						colors={ palette() }
						onChangeComplete={ ( colorValue ) => setAttributes( { textColor: colorValue.hex } ) }
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
		const { align, content, dropCap, backgroundColor, textColor } = attributes;
		const className = dropCap && 'has-drop-cap';

		if ( ! align ) {
			return <div style={ { backgroundColor: backgroundColor, color: textColor } }><p className={ className }>{ content }</p></div>;
		}

		return <div style={ { backgroundColor: backgroundColor, color: textColor } }><p style={ { textAlign: align } } className={ className }>{ content }</p></div>;
	},
} );
