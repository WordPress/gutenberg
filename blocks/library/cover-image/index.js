/**
 * WordPress dependencies
 */
import { Placeholder, Toolbar, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, source } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

const { children } = source;

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

registerBlockType( 'core/cover-image', {
	title: __( 'Cover Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		title: {
			type: 'array',
			source: children( 'h2' ),
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
		hasBackgroundDim: {
			type: 'boolean',
			default: true,
		},
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { url, title, align, id, hasParallax, hasBackgroundDim } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const toggleBackgroundDim = () => setAttributes( { hasBackgroundDim: ! hasBackgroundDim } );
		const style = url
			? { backgroundImage: `url(${ url })` }
			: undefined;
		const classes = classnames( className, {
			'has-parallax': hasParallax,
			'has-background-dim': hasBackgroundDim,
		} );

		const controls = focus && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>

				<Toolbar>
					<li>
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
					</li>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<BlockDescription>
					<p>{ __( 'Cover Image is a bold image block with an optional title.' ) }</p>
				</BlockDescription>
				<h3>{ __( 'Cover Image Settings' ) }</h3>
				<ToggleControl
					label={ __( 'Fixed Background' ) }
					checked={ !! hasParallax }
					onChange={ toggleParallax }
				/>
				<ToggleControl
					label={ __( 'Dim Background' ) }
					checked={ !! hasBackgroundDim }
					onChange={ toggleBackgroundDim }
				/>
			</InspectorControls>,
		];

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ __( 'Cover Image' ) }
					className={ className }>
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
		const { url, title, hasParallax, hasBackgroundDim } = attributes;
		const style = url
			? { backgroundImage: `url(${ url })` }
			: undefined;
		const classes = classnames( className, {
			'has-parallax': hasParallax,
			'has-background-dim': hasBackgroundDim,
		} );

		return (
			<section className={ classes } style={ style }>
				<h2>{ title }</h2>
			</section>
		);
	},
} );
