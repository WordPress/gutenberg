/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	TextControl,
	SelectControl,
	Button,
	Popover,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { applyFormat, removeFormat, useAnchor } from '@wordpress/rich-text';
import { language as languageIcon } from '@wordpress/icons';

const name = 'core/language';
const title = __( 'Language' );

export const language = {
	name,
	tagName: 'bdo',
	className: null,
	edit: Edit,
	title,
};

function Edit( { isActive, value, onChange, contentRef } ) {
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const togglePopover = () => {
		setIsPopoverVisible( ( state ) => ! state );
	};

	return (
		<>
			<RichTextToolbarButton
				icon={ languageIcon }
				label={ title }
				title={ title }
				onClick={ () => {
					if ( isActive ) {
						onChange( removeFormat( value, name ) );
					} else {
						togglePopover();
					}
				} }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
			{ isPopoverVisible && (
				<InlineLanguageUI
					value={ value }
					onChange={ onChange }
					onClose={ togglePopover }
					contentRef={ contentRef }
				/>
			) }
		</>
	);
}

function InlineLanguageUI( { value, contentRef, onChange, onClose } ) {
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: language,
	} );

	const [ lang, setLang ] = useState( '' );
	const [ dir, setDir ] = useState( 'ltr' );

	return (
		<Popover
			className="block-editor-format-toolbar__language-popover"
			anchor={ popoverAnchor }
			onClose={ onClose }
		>
			<VStack
				as="form"
				spacing={ 4 }
				className="block-editor-format-toolbar__language-container-content"
				onSubmit={ ( event ) => {
					event.preventDefault();
					onChange(
						applyFormat( value, {
							type: name,
							attributes: {
								lang,
								dir,
							},
						} )
					);
					onClose();
				} }
			>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ title }
					value={ lang }
					onChange={ ( val ) => setLang( val ) }
					help={ __(
						'A valid language attribute, like "en" or "fr".'
					) }
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Text direction' ) }
					value={ dir }
					options={ [
						{
							label: __( 'Left to right' ),
							value: 'ltr',
						},
						{
							label: __( 'Right to left' ),
							value: 'rtl',
						},
					] }
					onChange={ ( val ) => setDir( val ) }
				/>
				<HStack alignment="right">
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						text={ __( 'Apply' ) }
					/>
				</HStack>
			</VStack>
		</Popover>
	);
}
