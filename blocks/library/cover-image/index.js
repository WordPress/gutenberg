/**
 * WordPress dependencies
 */
import { Placeholder, Toolbar, Dashicon } from 'components';
import { __ } from 'i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

const { text } = query;

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

registerBlockType( 'core/cover-image', {
	title: __( 'Cover Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		title: text( 'h2' ),
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { url, title, align, id, hasParallax, hasBackgroundDim = true } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
						controls={ validAlignments }
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
				</BlockControls>
			)
		);

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ __( 'Image' ) }
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

		const style = { backgroundImage: `url(${ url })` };
		const sectionClasses = classnames( {
			'cover-image': true,
			'has-parallax': hasParallax,
			'has-background-dim': hasBackgroundDim,
		} );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const toggleBackgroundDim = () => setAttributes( { hasBackgroundDim: ! hasBackgroundDim } );

		return [
			controls,
			focus && (
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
				</InspectorControls>
			),
			<section key="cover-image" className={ className }>
				<section className={ sectionClasses } data-url={ url } style={ style }>
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
				</section>
			</section>,
		];
	},

	save( { attributes } ) {
		const { url, title, hasParallax, hasBackgroundDim } = attributes;
		const style = {
			backgroundImage: `url(${ url })`,
		};
		const sectionClasses = classnames( {
			'cover-image': true,
			'has-parallax': hasParallax,
			'has-background-dim': hasBackgroundDim,
		} );

		return (
			<section>
				<section className={ sectionClasses } style={ style }>
					<h2>{ title }</h2>
				</section>
			</section>
		);
	},
} );
