import {
	Popover,
	Button,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	TextareaControl,
} from '@wordpress/components';
import { inlineImage } from '@wordpress/icons';
import { Link, Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import {
	justifyTop,
	justifyCenterVertical,
	justifyBottom,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import {
	MediaUpload,
	RichTextToolbarButton,
	MediaUploadCheck,
} from '@wordpress/block-editor';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const name = 'core/image';
const title = __( 'Inline image' );

/**
 * Extracts vertical alignment from the style attribute.
 *
 * @param {string} style The style attribute string.
 * @return {string} The vertical alignment value or 'center' as default.
 */
function getVerticalAlignment( style ) {
	if ( ! style ) {
		return 'center';
	}

	const match = style.match( /vertical-align:\s*([^;]+)/ );
	const alignment = match ? match[ 1 ].trim() : 'center';

	// Convert 'middle' to 'center' for consistency with BlockVerticalAlignmentControl
	return alignment === 'middle' ? 'center' : alignment;
}

/**
 * Extracts the image ID from the className attribute.
 *
 * @param {Object} activeObjectAttributes The attributes of the active object.
 * @return {number|undefined} The extracted image ID or undefined if not found.
 */
function getCurrentImageId( activeObjectAttributes ) {
	if ( ! activeObjectAttributes?.className ) {
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

function InlineUI( { value, onChange, activeObjectAttributes, contentRef } ) {
	const { style, alt } = activeObjectAttributes;
	const width = style?.replace( /\D/g, '' );
	const verticalAlign = getVerticalAlignment( style );

	const [ editedWidth, setEditedWidth ] = useState( width );
	const [ editedAlt, setEditedAlt ] = useState( alt );
	const [ editedAlignment, setEditedAlignment ] = useState( verticalAlign );

	const hasChanged =
		editedWidth !== width ||
		editedAlt !== alt ||
		editedAlignment !== verticalAlign;
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
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

					// Build style string with width and vertical alignment
					let newStyle = '';
					if ( editedWidth ) {
						newStyle += `width: ${ editedWidth }px;`;
					}
					if ( editedAlignment ) {
						// Convert 'center' back to 'middle' for CSS compatibility
						const cssAlignment =
							editedAlignment === 'center'
								? 'middle'
								: editedAlignment;
						newStyle += ` vertical-align: ${ cssAlignment };`;
					}

					newReplacements[ value.start ] = {
						type: name,
						attributes: {
							...activeObjectAttributes,
							style: newStyle,
							alt: editedAlt,
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
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label="Vertical Alignment"
						value={ editedAlignment }
						onChange={ ( newAlignment ) => {
							setEditedAlignment( newAlignment );
						} }
					>
						<ToggleGroupControlOptionIcon
							icon={ justifyTop }
							label={ __( 'Align top' ) }
							value="top"
						/>
						<ToggleGroupControlOptionIcon
							icon={ justifyCenterVertical }
							label={ __( 'Align center' ) }
							value="center"
						/>
						<ToggleGroupControlOptionIcon
							icon={ justifyBottom }
							label={ __( 'Align bottom' ) }
							value="bottom"
						/>
					</ToggleGroupControl>
					<TextareaControl
						label={ __( 'Alternative text' ) }
						value={ editedAlt }
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
	contentRef,
} ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ getCurrentImageId( activeObjectAttributes ) }
				onSelect={ ( { id, url, alt, width: imgWidth } ) => {
					onChange(
						insertObject( value, {
							type: name,
							attributes: {
								className: `wp-image-${ id }`,
								style: `width: ${ Math.min(
									imgWidth,
									150
								) }px; vertical-align: middle;`,
								url,
								alt,
							},
						} )
					);
					onFocus();
				} }
				render={ ( { open } ) => (
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
					contentRef={ contentRef }
				/>
			) }
		</MediaUploadCheck>
	);
}
