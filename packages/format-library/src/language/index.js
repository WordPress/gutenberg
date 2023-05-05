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
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { applyFormat, removeFormat, useAnchor } from '@wordpress/rich-text';
import { translation } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const name = 'core/language';
const title = __( 'Language' );

export const language = {
	name,
	tagName: 'span',
	className: 'has-language',
	edit: Edit,
	title,
};

function Edit( props ) {
	const { contentRef, isActive, onChange, value } = props;
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: language,
	} );

	const [ lang, setLang ] = useState( '' );
	const [ dir, setDir ] = useState( 'ltr' );

	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	const { languages, userLocale } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const editorSettings = getEditorSettings();
		const definedLanguages = editorSettings.languages;
		return {
			languages: definedLanguages,
			userLocale: editorSettings.userLocale.replace( '_', '-' ),
		};
	}, [] );

	// Remove duplicates.

	const isStandardLanguage =
		languages.find( ( l ) => l.value === lang ) && lang !== '';
	const isRTL = ( checkLanguage ) => {
		// List of RTL language codes extrapolated from https://github.com/GlotPress/GlotPress/blob/cd8b6c49f9fc7e41020fdb7831a85ae16c576f8b/locales/locales.php
		const RTLlanguages = [
			'ar',
			'arq',
			'ary',
			'az',
			'azb',
			'bcc',
			'bgn',
			'ckb',
			'dv',
			'fa',
			'fas',
			'ha',
			'haz',
			'he',
			'kmr',
			'ku',
			'nqo',
			'ps',
			'pus',
			'sd',
			'skr',
			'snd',
			'ug',
			'uig',
			'ur',
			'urd',
			'yi',
			'yid',
		];
		return (
			'' !== checkLanguage &&
			RTLlanguages.includes( checkLanguage.split[ '-' ][ 0 ] )
		);
	};

	const togglePopover = () => {
		setIsPopoverVisible( ( state ) => ! state );
		setLang( userLocale );
		setDir( isRTL ? 'rtl' : 'ltr' );
	};

	if ( isStandardLanguage ) {
		if ( isRTL ) {
			applyFormat( value, {
				type: name,
				attributes: {
					lang,
					dir: 'rtl',
				},
			} );
		} else {
			applyFormat( value, {
				type: name,
				attributes: {
					lang,
					dir: 'ltr',
				},
			} );
		}
	}

	return (
		<>
			<RichTextToolbarButton
				icon={ translation }
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
				<Popover
					className="block-editor-format-toolbar__language-popover"
					anchor={ popoverAnchor }
					placement="bottom"
					onClose={ togglePopover }
				>
					<form
						className="block-editor-format-toolbar__language-container-content"
						onSubmit={ ( event ) => {
							onChange(
								applyFormat( value, {
									type: name,
									attributes: {
										lang,
										dir,
									},
								} )
							);
							togglePopover();
							event.preventDefault();
						} }
					>
						{ ! isStandardLanguage && (
							<TextControl
								label={ title }
								value={ lang }
								onChange={ ( val ) => setLang( val ) }
								help={ __(
									'A valid language attribute, like "en" or "fr".'
								) }
								options={ languages }
							/>
						) }
						{ isStandardLanguage && (
							<SelectControl
								label={ title }
								value={ lang }
								onChange={ ( val ) => setLang( val ) }
								options={ languages }
							/>
						) }
						{ ! isStandardLanguage && (
							<SelectControl
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
						) }
						<Button
							variant="primary"
							type="submit"
							text={ __( 'Apply' ) }
						/>
					</form>
				</Popover>
			) }
		</>
	);
}
