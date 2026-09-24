import { __ } from '@wordpress/i18n';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	TextControl,
	SelectControl as WCSelectControl,
	Button,
	Popover,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { applyFormat, removeFormat, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { language as languageIcon } from '@wordpress/icons';
import type { FormatEditProps } from '../types';

interface LanguageFormat {
	name: string;
	title: string;
	tagName: string;
	className: null;
	attributes: {
		lang: string;
		dir: string;
	};
	edit: ( props: FormatEditProps ) => React.ReactNode;
}

interface InlineLanguageUIProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	editableContentElement: HTMLElement | null;
	onClose: () => void;
}

const name = 'core/language';
const title = __( 'Language' );

export const language = {
	name,
	title,
	tagName: 'bdo',
	className: null,
	attributes: {
		lang: 'lang',
		dir: 'dir',
	},
	edit: Edit,
} satisfies LanguageFormat;

function Edit( {
	isActive,
	value,
	onChange,
	editableContentElement,
}: FormatEditProps ) {
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
					editableContentElement={ editableContentElement }
				/>
			) }
		</>
	);
}

function InlineLanguageUI( {
	value,
	editableContentElement,
	onChange,
	onClose,
}: InlineLanguageUIProps ) {
	const popoverAnchor = useAnchor( {
		editableContentElement,
		settings: language,
	} );

	const [ lang, setLang ] = useState( '' );
	const [ dir, setDir ] = useState< 'ltr' | 'rtl' >( 'ltr' );

	return (
		<Popover
			className="block-editor-format-toolbar__language-popover"
			anchor={ popoverAnchor }
			onClose={ onClose }
		>
			<Stack
				render={ <form /> }
				direction="column"
				gap="lg"
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
					label={ title }
					value={ lang }
					onChange={ ( val ) => setLang( val ) }
					help={ __(
						'A valid language attribute, like "en" or "fr".'
					) }
				/>
				<WCSelectControl
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
				<Stack justify="right">
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						text={ __( 'Apply' ) }
					/>
				</Stack>
			</Stack>
		</Popover>
	);
}
