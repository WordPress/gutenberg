/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, Spinner, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useDispatch, useSelect } from '@wordpress/data';
import { RichText, MediaPlaceholder } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import {
	closeSmall,
	chevronLeft,
	chevronRight,
	edit,
	image as imageIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { pickRelevantMediaFiles } from './shared';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
} from './constants';

const isTemporaryImage = ( id, url ) => ! id && isBlobURL( url );

export default function GalleryImage( {
	url,
	alt,
	id,
	linkTo,
	link,
	isFirstItem,
	isLastItem,
	isSelected,
	caption,
	sizeSlug,
	onSelect,
	onRemove,
	onMoveForward,
	onMoveBackward,
	setAttributes,
	'aria-label': ariaLabel,
} ) {
	const [ captionSelected, setCaptionSelected ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( false );

	const container = useRef( null );

	const image = useSelect(
		( select ) => {
			const { getMedia } = select( 'core' );

			return id ? getMedia( parseInt( id, 10 ) ) : null;
		},
		[ id ]
	);

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		'core/block-editor'
	);

	useEffect( () => {
		if ( image && ! url ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}

		// Unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected.
		if ( captionSelected && ! isSelected ) {
			setCaptionSelected( false );
		}
	}, [ isSelected, image, url, captionSelected ] );

	const onSelectCaption = () => {
		if ( ! captionSelected ) {
			setCaptionSelected( true );
		}

		if ( ! isSelected ) {
			onSelect();
		}
	};

	const onSelectImage = () => {
		if ( ! isSelected ) {
			onSelect();
		}

		if ( captionSelected ) {
			setCaptionSelected( false );
		}
	};

	const onRemoveImage = ( event ) => {
		if (
			container.current === document.activeElement &&
			isSelected &&
			[ BACKSPACE, DELETE ].includes( event.keyCode )
		) {
			event.stopPropagation();
			event.preventDefault();
			onRemove();
		}
	};

	const onEdit = () => setIsEditing( true );

	const onSelectImageFromLibrary = ( media ) => {
		if ( ! media || ! media.url ) {
			return;
		}

		let mediaAttributes = pickRelevantMediaFiles( media, sizeSlug );

		// If the current image is temporary but an alt text was meanwhile
		// written by the user, make sure the text is not overwritten.
		if ( isTemporaryImage( id, url ) ) {
			if ( alt ) {
				mediaAttributes = omit( mediaAttributes, [ 'alt' ] );
			}
		}

		// If a caption text was meanwhile written by the user,
		// make sure the text is not overwritten by empty captions.
		if ( caption && ! get( mediaAttributes, [ 'caption' ] ) ) {
			mediaAttributes = omit( mediaAttributes, [ 'caption' ] );
		}

		setAttributes( mediaAttributes );
		setIsEditing( false );
	};

	const onSelectCustomURL = ( newURL ) => {
		if ( newURL !== url ) {
			setAttributes( {
				url: newURL,
				id: undefined,
			} );
			setIsEditing( false );
		}
	};

	let href;

	switch ( linkTo ) {
		case LINK_DESTINATION_MEDIA:
			href = url;
			break;
		case LINK_DESTINATION_ATTACHMENT:
			href = link;
			break;
	}

	const img = (
		// Disable reason: Image itself is not meant to be interactive, but should
		// direct image selection and unfocus caption fields.
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
		<>
			<img
				src={ url }
				alt={ alt }
				data-id={ id }
				onClick={ onSelectImage }
				onFocus={ onSelectImage }
				onKeyDown={ onRemoveImage }
				tabIndex="0"
				aria-label={ ariaLabel }
				ref={ container }
			/>
			{ isBlobURL( url ) && <Spinner /> }
		</>
		/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
	);

	const className = classnames( {
		'is-selected': isSelected,
		'is-transient': isBlobURL( url ),
	} );

	return (
		<figure className={ className }>
			{ ! isEditing && ( href ? <a href={ href }>{ img }</a> : img ) }
			{ isEditing && (
				<MediaPlaceholder
					labels={ { title: __( 'Edit gallery image' ) } }
					icon={ imageIcon }
					onSelect={ onSelectImageFromLibrary }
					onSelectURL={ onSelectCustomURL }
					accept="image/*"
					allowedTypes={ [ 'image' ] }
					value={ { id, src: url } }
				/>
			) }
			<ButtonGroup className="block-library-gallery-item__inline-menu is-left">
				<Button
					icon={ chevronLeft }
					onClick={ isFirstItem ? undefined : onMoveBackward }
					label={ __( 'Move image backward' ) }
					aria-disabled={ isFirstItem }
					disabled={ ! isSelected }
				/>
				<Button
					icon={ chevronRight }
					onClick={ isLastItem ? undefined : onMoveForward }
					label={ __( 'Move image forward' ) }
					aria-disabled={ isLastItem }
					disabled={ ! isSelected }
				/>
			</ButtonGroup>
			<ButtonGroup className="block-library-gallery-item__inline-menu is-right">
				<Button
					icon={ edit }
					onClick={ onEdit }
					label={ __( 'Replace image' ) }
					disabled={ ! isSelected }
				/>
				<Button
					icon={ closeSmall }
					onClick={ onRemove }
					label={ __( 'Remove image' ) }
					disabled={ ! isSelected }
				/>
			</ButtonGroup>
			{ ! isEditing && ( isSelected || caption ) && (
				<RichText
					tagName="figcaption"
					placeholder={ isSelected ? __( 'Write caption…' ) : null }
					value={ caption }
					isSelected={ captionSelected }
					onChange={ ( newCaption ) =>
						setAttributes( { caption: newCaption } )
					}
					unstableOnFocus={ onSelectCaption }
					inlineToolbar
				/>
			) }
		</figure>
	);
}
