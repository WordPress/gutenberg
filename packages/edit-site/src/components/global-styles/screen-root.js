/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	CardBody,
	Card,
	CardDivider,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StylesPreview from './preview';
import NavigationButton from './navigation-button';
import ContextMenu from './context-menu';

function ScreenRoot() {
	return (
		<Card size="small">
			<CardBody>
				<StylesPreview />
			</CardBody>

			<CardBody>
				<ContextMenu />
			</CardBody>

			<CardDivider />

			<CardBody>
				<ItemGroup>
					<Item>
						<p>
							{ __(
								'Customize the appearance of specific blocks for the whole site.'
							) }
						</p>
					</Item>
					<NavigationButton path="/blocks">
						{ __( 'Blocks' ) }
					</NavigationButton>
				</ItemGroup>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
