/**
 * WordPress dependencies
 */
import { Placeholder } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

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

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, title, align } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
						controls={ validAlignments }
					/>
				</BlockControls>
			)
		);

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			const setMediaUrl = ( media ) => setAttributes( { url: media.url } );
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ __( 'Image' ) }
					className="blocks-image">
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ setMediaUrl }
						type="image"
						autoOpen
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		const style = { backgroundImage: `url(${ url })` };

		return [
			controls,
			<section key="cover-image" className="blocks-cover-image">
				<section className="cover-image" data-url={ url } style={ style }>
					{ title || !! focus ? (
						<Editable
							tagName="h2"
							placeholder={ __( 'Write title' ) }
							value={ title }
							formattingControls={ [] }
							focus={ focus }
							onFocus={ setFocus }
							onChange={ ( value ) => setAttributes( { title: value } ) } />
					) : null }
				</section>
			</section>,
		];
	},

	save( { attributes } ) {
		const { url, title } = attributes;
		const style = {
			backgroundImage: `url(${ url })`,
		};

		return (
			<section className="blocks-cover-image">
				<section className="cover-image" style={ style }>
					<h2>{ title }</h2>
				</section>
			</section>
		);
	},
} );
