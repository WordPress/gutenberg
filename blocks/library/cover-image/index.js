/**
 * WordPress dependencies
 */
import { Placeholder, Toolbar, Dashicon, DropZone } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { mediaUpload } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, createBlock } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

registerBlockType( 'core/cover-image', {
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

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { url, title, align, id, hasParallax, dimRatio } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );
		const dropFiles = ( files ) => mediaUpload( files, setAttributes );
		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const controls = focus && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>

				<Toolbar>
					<MediaUploadButton
						buttonProps={ {
							className: 'components-icon-button components-toolbar__control',
							'aria-label': __( 'Edit image' ),
						} }
						onSelect={ onSelectImage }
						type="image"
						value={ id }
					>
						<Dashicon icon="edit" />
					</MediaUploadButton>
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
			</InspectorControls>,
		];

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			const icon = title ? undefined : 'format-image';
			const label = title ? (
				<Editable
					tagName="h2"
					value={ title }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					inlineToolbar
				/>
			) : __( 'Cover Image' );

			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon={ icon }
					label={ label }
					className={ className }>
					<DropZone
						onFilesDrop={ dropFiles }
					/>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ onSelectImage }
						type="image"
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
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
				{ title || !! focus ? (
					<Editable
						tagName="h2"
						placeholder={ __( 'Write title…' ) }
						value={ title }
						focus={ focus }
						onFocus={ setFocus }
						onChange={ ( value ) => setAttributes( { title: value } ) }
						inlineToolbar
					/>
				) : null }
			</section>,
		];
	},

	save( { attributes, className } ) {
		const { url, title, hasParallax, dimRatio, align } = attributes;
		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
			align ? `align${ align }` : null,
		);

		return (
			<section className={ classes } style={ style }>
				<h2>{ title }</h2>
			</section>
		);
	},
} );

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
