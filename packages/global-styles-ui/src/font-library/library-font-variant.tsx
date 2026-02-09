/**
 * WordPress dependencies
 */
import { useContext, useId } from '@wordpress/element';
import { CheckboxControl, Flex, Icon, Tooltip } from '@wordpress/components';
import { cautionFilled } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import type { FontFace, FontFamily } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';
import { FontLibraryContext } from './context';
import FontDemo from './font-demo';

function LibraryFontVariant( {
	face,
	font,
}: {
	face: FontFace;
	font: FontFamily;
} ) {
	const { isFontActivated, toggleActivateFont } =
		useContext( FontLibraryContext );

	const isInstalled =
		( font?.fontFace?.length ?? 0 ) > 0
			? isFontActivated(
					font.slug,
					face.fontStyle,
					face.fontWeight,
					font.source
			  )
			: isFontActivated( font.slug, undefined, undefined, font.source );

	const isMissingFile = face.fileStatus === 'missing';

	const handleToggleActivation = () => {
		if ( ( font?.fontFace?.length ?? 0 ) > 0 ) {
			toggleActivateFont( font, face );
			return;
		}
		toggleActivateFont( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );
	const checkboxId = useId();

	return (
		<div
			className={ `font-library__font-card${
				isMissingFile ? ' has-missing-file' : ''
			}` }
		>
			<Flex justify="flex-start" align="center" gap="1rem">
				<CheckboxControl
					checked={ isInstalled }
					onChange={ handleToggleActivation }
					id={ checkboxId }
				/>
				<label htmlFor={ checkboxId }>
					<FontDemo
						font={ face }
						text={ displayName }
						onClick={ handleToggleActivation }
					/>
				</label>
				{ isMissingFile && (
					<Tooltip
						text={ __(
							'Font file not found on the server. The file may have been deleted.'
						) }
					>
						<span className="font-library__missing-file-icon">
							<Icon icon={ cautionFilled } size={ 20 } />
						</span>
					</Tooltip>
				) }
			</Flex>
		</div>
	);
}

export default LibraryFontVariant;
