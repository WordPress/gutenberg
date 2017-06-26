/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { concatChildren } from 'element';
import { Toolbar } from 'components';

/**
 * Internal dependencies
 */
import { registerBlockType, createBlock, query as hpq, setDefaultBlock } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';

const { children, query } = hpq;

registerBlockType( 'core/text', {
	title: __( 'Text' ),

	icon: 'text',

	category: 'common',

	className: false,

	attributes: {
		content: query( 'p', children() ),
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, insertBlockAfter, focus, setFocus, mergeBlocks } ) {
		const { align, content, dropCap } = attributes;
		const toggleDropCap = () => setAttributes( { dropCap: ! dropCap } );
		return [
			focus && (
				<BlockControls key="controls">
					<Toolbar
						controls={ [ {
							icon: 'editor-aligncenter',
							title: __( 'Align center' ),
							isActive: align === 'center',
							onClick: () => setAttributes( {
								align: align === 'center' ? null : 'center',
							} ),
						} ] }
					/>
				</BlockControls>
			),
			focus && (
				<InspectorControls key="inspector">
					<ToggleControl
						label={ __( 'Drop Cap' ) }
						checked={ !! dropCap }
						onChange={ toggleDropCap }
					/>
					<h3>{ __( 'Text Alignment' ) }</h3>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</InspectorControls>
			),
			<Editable
				inline
				tagName="p"
				key="editable"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				onSplit={ ( before, after ) => {
					setAttributes( { content: before } );
					insertBlockAfter( createBlock( 'core/text', {
						content: after,
					} ) );
				} }
				onMerge={ mergeBlocks }
				style={ { textAlign: align } }
				className={ `drop-cap-${ dropCap }` }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, content } = attributes;

		if ( ! align ) {
			return <p>{ content }</p>;
		}

		return <p style={ { textAlign: align } }>{ content }</p>;
	},
} );

setDefaultBlock( 'core/text' );
