/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { IconButton, PanelBody, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { createBlock } from '../../api';
import RichText from '../../rich-text';
import AlignmentToolbar from '../../alignment-toolbar';
import MediaUpload from '../../media-upload';
import ImagePlaceHolder from '../../image-placeholder';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

export const name = 'core/cover-image';

export const settings = {
	title: __( 'Cover Image' ),

	description: __( 'Cover Image is a bold image block with an optional title.' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		title: {
			type: 'array',
			source: 'children',
			selector: 'h2',
		},
		url: {
			type: 'string',
		},
		align: {
			type: 'string',
		},
		contentAlign: {
			type: 'string',
			default: 'center',
		},
		id: {
			type: 'number',
		},
		hasParallax: {
			type: 'boolean',
			default: false,
		},
		dimRatio: {
			type: 'number',
			default: 50,
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => (
					createBlock( 'core/cover-image', { title: content } )
				),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { title } ) => (
					createBlock( 'core/heading', { content: title } )
				),
			},
		],
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { url, title, align, contentAlign, id, hasParallax, dimRatio } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			contentAlign !== 'center' && `has-${ contentAlign }-content`,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const alignmentToolbar	= (
			<AlignmentToolbar
				value={ contentAlign }
				onChange={ ( nextAlign ) => {
					setAttributes( { contentAlign: nextAlign } );
				} }
			/>
		);
		const controls = isSelected && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>

				{ alignmentToolbar }
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectImage }
						type="image"
						value={ id }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit image' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<h2>{ __( 'Cover Image Settings' ) }</h2>
				<ToggleControl
					label={ __( 'Fixed Background' ) }
					checked={ !! hasParallax }
					onChange={ toggleParallax }
				/>
				<RangeControl
					label={ __( 'Background Dimness' ) }
					value={ dimRatio }
					onChange={ setDimRatio }
					min={ 0 }
					max={ 100 }
					step={ 10 }
				/>
				<PanelBody title={ __( 'Text Alignment' ) }>
					{ alignmentToolbar }
				</PanelBody>
			</InspectorControls>,
		];

		if ( ! url ) {
			const hasTitle = ! isEmpty( title );
			const icon = hasTitle ? undefined : 'format-image';
			const label = hasTitle ? (
				<RichText
					tagName="h2"
					value={ title }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					isSelected={ isSelected }
					inlineToolbar
				/>
			) : __( 'Cover Image' );

			return [
				controls,
				<ImagePlaceHolder key="cover-image-placeholder"
					{ ...{ className, icon, label, onSelectImage } }
				/>,
			];
		}

		return [
			controls,
			<section
				key="preview"
				data-url={ url }
				style={ style }
				className={ classes }
			>
				{ title || isSelected ? (
					<RichText
						tagName="h2"
						placeholder={ __( 'Write title…' ) }
						value={ title }
						onChange={ ( value ) => setAttributes( { title: value } ) }
						isSelected={ isSelected }
						inlineToolbar
					/>
				) : null }
			</section>,
		];
	},

	save( { attributes, className } ) {
		const { url, title, hasParallax, dimRatio, align, contentAlign } = attributes;
		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
				[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
			},
			align ? `align${ align }` : null,
		);

		return (
			<section className={ classes } style={ style }>
				<h2>{ title }</h2>
			</section>
		);
	},
};

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
