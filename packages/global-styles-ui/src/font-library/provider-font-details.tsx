import { Stack, Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import type { FontFamily } from '@wordpress/core-data';
import FontDemo from './font-demo';
import { getFontFaceVariantName } from './utils';
import { sortFontFaces } from './utils/sort-font-faces';
import type { FontProvider } from './font-providers';

/**
 * Read-only face list for a font supplied by a font provider.
 *
 * The provider prints these faces while it is active. There is nothing to
 * activate or delete here, so the faces are listed without checkboxes.
 *
 * @param props          Component props.
 * @param props.font     The selected font family.
 * @param props.provider The provider that supplies it.
 */
function ProviderFontDetails( {
	font,
	provider,
}: {
	font: FontFamily;
	provider?: FontProvider;
} ) {
	return (
		<Stack direction="column" gap="xl" className="font-library__provider">
			<Stack direction="column" gap="sm">
				<Text variant="body-md" render={ <p /> }>
					{ provider
						? sprintf(
								/* translators: %s: Name of the plugin or other extension that supplies the font. */
								__(
									'Supplied by %s while it is active. Its faces are printed automatically and are not added to the font choices.'
								),
								provider.label
							)
						: __(
								'Supplied by an active extension. Its faces are printed automatically and are not added to the font choices.'
							) }
				</Text>
				{ provider?.description && (
					<Text variant="body-sm" render={ <p /> }>
						{ provider.description }
					</Text>
				) }
			</Stack>
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */
			/* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul role="list" className="font-library__fonts-list">
				{ sortFontFaces( font.fontFace ?? [] ).map( ( face, i ) => (
					<li
						key={ `face${ i }` }
						className="font-library__fonts-list-item"
					>
						<div className="font-library__font-card">
							<FontDemo
								font={ face }
								text={
									font.name +
									' ' +
									getFontFaceVariantName( face )
								}
							/>
						</div>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</Stack>
	);
}

export default ProviderFontDetails;
