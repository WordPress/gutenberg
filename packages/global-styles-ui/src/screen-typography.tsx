import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { typography as typographyIcon } from '@wordpress/icons';
import { useContext } from '@wordpress/element';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import TypographyVariations from './variations/variations-typography';
import FontFamilies from './font-families';
import FontSizesCount from './font-sizes/font-sizes-count';
import TextShadows from './text-shadows';
import { GlobalStylesContext } from './context';
import { useSetting } from './hooks';
import { NavigationButtonAsItem } from './navigation-button';
import { Subtitle } from './subtitle';

function ScreenTypography() {
	const { fontLibraryEnabled } = useContext( GlobalStylesContext );

	const [ hasTextShadowControl ] = useSetting< boolean | undefined >(
		'typography.textShadow'
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the fonts and typographic styles available across the site.'
				) }
			/>
			<ScreenBody>
				<Stack direction="column" gap="xl">
					<TypographyVariations title={ __( 'Typesets' ) } />
					{ fontLibraryEnabled && <FontFamilies /> }
					<FontSizesCount />
					{ hasTextShadowControl && <TextShadows /> }
					{ /*
					   The site's base text is styled at the root rather than
					   as an element, so it is offered here with the other
					   site-wide typography rather than in the elements list.
					*/ }
					<Stack direction="column" gap="sm">
						<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<NavigationButtonAsItem
								icon={ typographyIcon }
								path="/typography/text"
							>
								{ __( 'Text' ) }
							</NavigationButtonAsItem>
						</ItemGroup>
					</Stack>
				</Stack>
			</ScreenBody>
		</>
	);
}

export default ScreenTypography;
