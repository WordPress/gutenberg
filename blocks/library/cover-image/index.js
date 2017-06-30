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
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';

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
		const { url, title, align, id, hasParallax } = attributes;
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
								buttonProps={ { className: 'components-icon-button components-toolbar__control' } }
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
						autoOpen
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
		} );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );

		return [
			controls,
			focus && (
				<InspectorControls key="inspector">
					<ToggleControl
						label={ __( 'Fixed Position' ) }
						checked={ !! hasParallax }
						onChange={ toggleParallax }
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
							inline
							inlineToolbar
						/>
					) : null }
				</section>
			</section>,
		];
	},

	save( { attributes } ) {
		const { url, title, hasParallax } = attributes;
		const style = {
			backgroundImage: `url(${ url })`,
		};
		const sectionClasses = classnames( {
			'cover-image': true,
			'has-parallax': hasParallax,
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
