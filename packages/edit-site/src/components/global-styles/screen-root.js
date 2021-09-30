/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StylesPreview from './preview';
import NavigationButton from './navigation-button';
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import ContextMenu from './context-menu';

function ScreenRoot() {
	const { root } = useGlobalStylesContext();

	return (
		<>
			<StylesPreview />

			<ContextMenu context={ root } />

			<ItemGroup>
				<Item>
					<p>
						{ __(
							'Customize the appearance of specific blocks for the whole site'
						) }
					</p>
				</Item>
				<NavigationButton path="/blocks">
					{ __( 'Blocks' ) }
				</NavigationButton>
			</ItemGroup>
		</>
	);
}

export default ScreenRoot;
