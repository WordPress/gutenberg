/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	Button,
	Flex,
	FlexItem,
	Icon,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontDemo from './font-demo';
import { getFamilyPreviewStyle } from './utils/preview-styles';
import { chevronRight } from '@wordpress/icons';

function FontCard( { font, onClick, variantsText } ) {
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
		cursor: !! onClick ? 'pointer' : 'default',
	};

	return (
		<Button
			onClick={ onClick }
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

export default FontCard;
