/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	Button,
	FlexItem,
	FlexBlock,
	__experimentalSpacer as Spacer,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { moreVertical } from '@wordpress/icons';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { useStyle } from './hooks';
import { unlock } from './lock-unlock';

// Access AdvancedPanel from block-editor private APIs
const { AdvancedPanel: StylesAdvancedPanel } = unlock( blockEditorPrivateApis );
const { Menu } = unlock( componentsPrivateApis );

function ScreenCSS() {
	// Get user-only styles (should not decode/encode to preserve raw CSS)
	const [ style ] = useStyle( '', undefined, 'user', false );
	// Get all styles (inherited + user) for context
	const [ inheritedStyle, setStyle ] = useStyle(
		'',
		undefined,
		'merged',
		false
	);
	// Compare against theme-default CSS so Reset remains available when the
	// user has cleared CSS to an empty string while the theme provides one.
	const [ baseStyle ] = useStyle( '', undefined, 'base', false );
	const canReset = inheritedStyle?.css !== baseStyle?.css;

	return (
		<>
			<Stack direction="row" justify="space-between" align="flex-start">
				<FlexBlock>
					<ScreenHeader
						title={ __( 'Additional CSS' ) }
						description={
							<>
								{ __(
									'You can add custom CSS to further customize the appearance and layout of your site.'
								) }
								<br />
								<ExternalLink
									href={ __(
										'https://developer.wordpress.org/advanced-administration/wordpress/css/'
									) }
									className="global-styles-ui-screen-css-help-link"
								>
									{ __( 'Learn more about CSS' ) }
								</ExternalLink>
							</>
						}
					/>
				</FlexBlock>
				<FlexItem>
					<Spacer marginTop={ 3 } marginBottom={ 0 } paddingX={ 4 }>
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'CSS options' ) }
									/>
								}
							/>
							<Menu.Popover>
								<Menu.Item
									disabled={ ! canReset }
									onClick={ () => {
										const { css: _css, ...rest } =
											style ?? {};
										setStyle( rest );
									} }
								>
									<Menu.ItemLabel>
										{ __( 'Reset' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							</Menu.Popover>
						</Menu>
					</Spacer>
				</FlexItem>
			</Stack>
			<div className="global-styles-ui-screen-css">
				<StylesAdvancedPanel
					value={ style }
					onChange={ setStyle }
					inheritedValue={ inheritedStyle }
				/>
			</div>
		</>
	);
}

export default ScreenCSS;
