/**
 * WordPress dependencies
 */
import Placeholder from 'components/placeholder';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';

const { text } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

const editMediaLibrary = ( attributes, setAttributes ) => {
	const frameConfig = {
		frame: 'post',
		title: wp.i18n.__( 'Change cover image' ),
		button: {
			text: wp.i18n.__( 'Select' ),
		},
	};

	const editFrame = wp.media( frameConfig );
	function updateFn( model ) {
		setAttributes( {
			url: model.single().attributes.url,
			image: model.single().attributes,
		} );
	}

	editFrame.on( 'insert', updateFn );
	editFrame.open( 'cover-image' );
};

registerBlockType( 'core/cover-image', {
	title: wp.i18n.__( 'Cover Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		title: text( 'h2' ),
	},

	controls: [
		{
			icon: 'format-image',
			title: wp.i18n.__( 'Change Image' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: editMediaLibrary,
		},
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-full-width',
			title: wp.i18n.__( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
		{
			icon: 'admin-post',
			title: wp.i18n.__( 'Fixed' ),
			isActive: ( { align } ) => 'fixed' === align,
			onClick: toggleAlignment( 'fixed' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		const validAlignments = [ 'left', 'right', 'wide', 'fixed' ];
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, title } = attributes;

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			const setMediaUrl = ( media ) => setAttributes( { url: media.url } );
			return (
				<Placeholder
					instructions={ wp.i18n.__( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ wp.i18n.__( 'Image' ) }
					className="blocks-image">
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ setMediaUrl }
						type="image"
						auto-open
					>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>
			);
		}

		const style = {
			backgroundImage: `url(${ url })`,
		};

		return (
			<section className="blocks-cover-image">
				<section className="cover-image" data-url={ url } style={ style }>
					{ title || !! focus ? (
						<Editable
							tagName="h2"
							placeholder={ wp.i18n.__( 'Write title' ) }
							value={ title }
							formattingControls={ [] }
							focus={ focus }
							onFocus={ setFocus }
							onChange={ ( value ) => setAttributes( { title: value } ) } />
					) : null }
				</section>
			</section>
		);
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
