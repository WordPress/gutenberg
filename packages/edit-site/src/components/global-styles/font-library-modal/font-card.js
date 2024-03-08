/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import {
	__experimentalUseNavigator as useNavigator,
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
import { chevronRight } from '@wordpress/icons';

function FontCard( { font, onClick, variantsText, navigatorPath } ) {
	const variantsCount = font.fontFace?.length || 1;

	const style = {
		cursor: !! onClick ? 'pointer' : 'default',
	};

	const navigator = useNavigator();

	return (
		<Button
			onClick={ () => {
				onClick();
				if ( navigatorPath ) {
					navigator.goTo( navigatorPath );
				}
			} }
			style={ style }
			className="font-library-modal__font-card"
		>
			<Flex justify="space-between" wrap={ false }>
				<FontDemo font={ font } />
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
