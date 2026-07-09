/**
 * WordPress dependencies
 */
import { _n, sprintf, isRTL } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import {
	useNavigator,
	__experimentalText as WCText,
	Button,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import type { FontFamily } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import FontDemo from './font-demo';

function FontCard( {
	font,
	onClick,
	variantsText,
	navigatorPath,
	shouldFocus,
}: {
	font: FontFamily;
	onClick: () => void;
	variantsText?: string;
	navigatorPath?: string;
	shouldFocus?: boolean;
} ) {
	const variantsCount = font.fontFace?.length || 1;

	const style = {
		cursor: !! onClick ? 'pointer' : 'default',
	};

	const navigator = useNavigator();
	const ref = useRef< HTMLButtonElement >( null );

	useEffect( () => {
		if ( shouldFocus ) {
			ref.current?.focus();
		}
	}, [ shouldFocus ] );

	return (
		<Button
			ref={ ref }
			__next40pxDefaultSize
			onClick={ () => {
				onClick();
				if ( navigatorPath ) {
					navigator.goTo( navigatorPath );
				}
			} }
			style={ style }
			className="font-library__font-card"
		>
			<Flex justify="space-between" wrap={ false }>
				<FontDemo font={ font } />
				<Flex justify="flex-end">
					<FlexItem>
						<WCText className="font-library__font-card__count">
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
						</WCText>
					</FlexItem>
					<FlexItem>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</FlexItem>
				</Flex>
			</Flex>
		</Button>
	);
}

export default FontCard;
