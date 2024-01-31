/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	Button,
	Flex,
	FlexItem,
	Icon,
} from '@wordpress/components';
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontDemo from './font-demo';
import { getFamilyPreviewStyle } from './utils/preview-styles';
import { FontLibraryContext } from './context';
import { chevronRight } from '@wordpress/icons';

function FontCard( { font, onChange }, forwardedRef ) {
	const { getFontFacesActivated } = useContext( FontLibraryContext );

	const variantsInstalled =
		font?.fontFace?.length > 0 ? font.fontFace.length : 1;
	const variantsActive = getFontFacesActivated(
		font.slug,
		font.source
	).length;
	const variantsText = sprintf(
		/* translators: 1: Active font variants, 2: Total font variants. */
		__( '%1$s/%2$s variants active' ),
		variantsActive,
		variantsInstalled
	);
	const fakeFontFace = {
		fontStyle: 'normal',
		fontWeight: '400',
		fontFamily: font.fontFamily,
		fake: true,
	};
	const displayFontFace =
		font.fontFace && font.fontFace.length
			? font?.fontFace?.find(
					( face ) =>
						face.fontStyle === 'normal' && face.fontWeight === '400'
			  ) || font.fontFace[ 0 ]
			: fakeFontFace;

	const demoStyle = getFamilyPreviewStyle( font );

	const variantsCount = font.fontFace?.length || 1;

	const style = {
		cursor: !! onChange ? 'pointer' : 'default',
	};

	return (
		<Button
			ref={ forwardedRef }
			onClick={ () => onChange( font ) }
			style={ style }
			className="font-library-modal__font-card"
		>
			<Flex justify="space-between" wrap={ false }>
				<FontDemo
					customPreviewUrl={ font.preview }
					fontFace={ displayFontFace }
					text={ font.name }
					style={ demoStyle }
				/>
				<Flex justify="flex-end">
					<FlexItem>
						<Text className="font-library-modal__font-card__count">
							{ variantsText ||
								sprintf(
									/* translators: %d: Number of font variants. */
									_n(
										'%d variant',
										'%d variants',
										variantsCount
									),
									variantsCount
								) }
						</Text>
					</FlexItem>
					<FlexItem>
						<Icon icon={ chevronRight } />
					</FlexItem>
				</Flex>
			</Flex>
		</Button>
	);
}

export default forwardRef( FontCard );
