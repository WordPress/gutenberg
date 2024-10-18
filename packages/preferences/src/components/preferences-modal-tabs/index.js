/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	Navigator,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	FlexItem,
	Card,
	CardHeader,
	CardBody,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';
import { isRTL, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const PREFERENCES_MENU = 'preferences-menu';

export default function PreferencesModalTabs( { sections } ) {
	const isLargeViewport = useViewportMatch( 'medium' );

	// This is also used to sync the two different rendered components
	// between small and large viewports.
	const [ activeMenu, setActiveMenu ] = useState( PREFERENCES_MENU );
	/**
	 * Create helper objects from `sections` for easier data handling.
	 * `tabs` is used for creating the `Tabs` and `sectionsContentMap`
	 * is used for easier access to active tab's content.
	 */
	const { tabs, sectionsContentMap } = useMemo( () => {
		let mappedTabs = {
			tabs: [],
			sectionsContentMap: {},
		};
		if ( sections.length ) {
			mappedTabs = sections.reduce(
				( accumulator, { name, tabLabel: title, content } ) => {
					accumulator.tabs.push( { name, title } );
					accumulator.sectionsContentMap[ name ] = content;
					return accumulator;
				},
				{ tabs: [], sectionsContentMap: {} }
			);
		}
		return mappedTabs;
	}, [ sections ] );

	let modalContent;
	// We render different components based on the viewport size.
	if ( isLargeViewport ) {
		modalContent = (
			<div className="preferences__tabs">
				<Tabs
					defaultTabId={
						activeMenu !== PREFERENCES_MENU ? activeMenu : undefined
					}
					onSelect={ setActiveMenu }
					orientation="vertical"
				>
					<Tabs.TabList className="preferences__tabs-tablist">
						{ tabs.map( ( tab ) => (
							<Tabs.Tab
								tabId={ tab.name }
								key={ tab.name }
								className="preferences__tabs-tab"
							>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ tabs.map( ( tab ) => (
						<Tabs.TabPanel
							tabId={ tab.name }
							key={ tab.name }
							className="preferences__tabs-tabpanel"
							focusable={ false }
						>
							{ sectionsContentMap[ tab.name ] || null }
						</Tabs.TabPanel>
					) ) }
				</Tabs>
			</div>
		);
	} else {
		modalContent = (
			<Navigator initialPath="/" className="preferences__provider">
				<Navigator.Screen path="/">
					<Card isBorderless size="small">
						<CardBody>
							<ItemGroup>
								{ tabs.map( ( tab ) => {
									return (
										<Navigator.Button
											key={ tab.name }
											path={ `/${ tab.name }` }
											as={ Item }
											isAction
										>
											<HStack justify="space-between">
												<FlexItem>
													<Truncate>
														{ tab.title }
													</Truncate>
												</FlexItem>
												<FlexItem>
													<Icon
														icon={
															isRTL()
																? chevronLeft
																: chevronRight
														}
													/>
												</FlexItem>
											</HStack>
										</Navigator.Button>
									);
								} ) }
							</ItemGroup>
						</CardBody>
					</Card>
				</Navigator.Screen>
				{ sections.length &&
					sections.map( ( section ) => {
						return (
							<Navigator.Screen
								key={ `${ section.name }-menu` }
								path={ `/${ section.name }` }
							>
								<Card isBorderless size="large">
									<CardHeader
										isBorderless={ false }
										justify="left"
										size="small"
										gap="6"
									>
										<Navigator.BackButton
											icon={
												isRTL()
													? chevronRight
													: chevronLeft
											}
											label={ __( 'Back' ) }
										/>
										<Text size="16">
											{ section.tabLabel }
										</Text>
									</CardHeader>
									<CardBody>{ section.content }</CardBody>
								</Card>
							</Navigator.Screen>
						);
					} ) }
			</Navigator>
		);
	}

	return modalContent;
}
