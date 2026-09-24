import {
	Popover,
	Button,
	__experimentalNumberControl as NumberControl,
	TextareaControl as WCTextareaControl,
} from '@wordpress/components';
import { inlineImage } from '@wordpress/icons';
import { Link, Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import {
	MediaUpload,
	RichTextToolbarButton,
	MediaUploadCheck,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import type { FormatEditProps } from '../types';

/**
 * The attributes the `core/image` format registers.
 */
interface ImageFormatAttributes {
	className?: string;
	style?: string;
	url?: string;
	alt?: string;
}

interface InlineImageUIProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	activeObjectAttributes: ImageFormatAttributes;
	editableContentElement: HTMLElement | null;
}

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const name = 'core/image';
const title = __( 'Inline image' );

/**
 * Extracts the image ID from the className attribute.
 *
 * @param activeObjectAttributes The attributes of the active object.
 * @return The extracted image ID or undefined if not found.
 */
function getCurrentImageId(
	activeObjectAttributes: ImageFormatAttributes
): number | undefined {
	if ( ! activeObjectAttributes.className ) {
		return undefined;
	}

	const [ , id ] =
		activeObjectAttributes.className.match( /wp-image-(\d+)/ ) ?? [];

	return id ? parseInt( id, 10 ) : undefined;
}

export const image = {
	name,
	title,
	keywords: [ __( 'photo' ), __( 'media' ) ],
	object: true,
	tagName: 'img',
	className: null,
	attributes: {
		className: 'class',
		style: 'style',
		url: 'src',
		alt: 'alt',
	},
	edit: Edit,
};

function InlineUI( {
	value,
	onChange,
	activeObjectAttributes,
	editableContentElement,
}: InlineImageUIProps ) {
	const style = activeObjectAttributes.style;
	const alt = activeObjectAttributes.alt;

	const width = style?.replace( /\D/g, '' );
	const [ editedWidth, setEditedWidth ] = useState( width );
	const [ editedAlt, setEditedAlt ] = useState( alt );
	const hasChanged = editedWidth !== width || editedAlt !== alt;
	const popoverAnchor = useAnchor( {
		editableContentElement,
		settings: image,
	} );

	return (
		<Popover
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__image-popover"
		>
			<form
				className="block-editor-format-toolbar__image-container-content"
				onSubmit={ ( event ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						type: name,
						attributes: {
							...activeObjectAttributes,
							style: editedWidth
								? `width: ${ editedWidth }px;`
								: '',
							alt: editedAlt ?? '',
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );

					event.preventDefault();
				} }
			>
				<Stack direction="column" gap="lg">
					<NumberControl
						label={ __( 'Width' ) }
						value={ editedWidth }
						min={ 1 }
						onChange={ ( newWidth ) => {
							setEditedWidth( newWidth );
						} }
					/>
					<WCTextareaControl
						label={ __( 'Alternative text' ) }
						value={ editedAlt ?? '' }
						onChange={ ( newAlt ) => {
							setEditedAlt( newAlt );
						} }
						help={
							<>
								<Link
									openInNewTab
									href={
										// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
										__(
											'https://www.w3.org/WAI/tutorials/images/decision-tree/'
										)
									}
								>
									{ __(
										'Describe the purpose of the image.'
									) }
								</Link>
								<br />
								{ __( 'Leave empty if decorative.' ) }
							</>
						}
					/>
					<Stack justify="right">
						<Button
							disabled={ ! hasChanged }
							accessibleWhenDisabled
							variant="primary"
							type="submit"
							size="compact"
						>
							{ __( 'Apply' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Popover>
	);
}

function Edit( {
	value,
	onChange,
	onFocus,
	isObjectActive,
	activeObjectAttributes,
	editableContentElement,
}: FormatEditProps ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ getCurrentImageId( activeObjectAttributes ) }
				onSelect={ ( {
					id,
					url,
					alt,
					width: imgWidth,
				}: {
					id: number;
					url: string;
					alt: string;
					width: number;
				} ) => {
					onChange(
						insertObject( value, {
							type: name,
							attributes: {
								className: `wp-image-${ id }`,
								style: `width: ${ Math.min(
									imgWidth,
									150
								) }px;`,
								url,
								alt,
							},
						} )
					);
					onFocus();
				} }
				render={ ( { open }: { open: () => void } ) => (
					<RichTextToolbarButton
						icon={ inlineImage }
						title={ isObjectActive ? __( 'Replace image' ) : title }
						onClick={ open }
						isActive={ isObjectActive }
					/>
				) }
			/>
			{ isObjectActive && (
				<InlineUI
					value={ value }
					onChange={ onChange }
					activeObjectAttributes={ activeObjectAttributes }
					editableContentElement={ editableContentElement }
				/>
			) }
		</MediaUploadCheck>
	);
}
