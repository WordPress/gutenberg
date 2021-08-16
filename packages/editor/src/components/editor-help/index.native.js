/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	BottomSheet,
	BottomSheetConsumer,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	helpFilled,
	plusCircleFilled,
	alignJustifyAlt,
	trashFilled,
	cogAlt,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import HelpTopicRow from './help-topic-row';
import HelpDetailNavigationScreen from './help-detail-navigation-screen';
import IntroToBlocks from './intro-to-blocks';
import AddBlocks from './add-blocks';
import MoveBlocks from './move-blocks';
import RemoveBlocks from './remove-blocks';
import CustomizeBlocks from './customize-blocks';

const HELP_TOPICS = [
	{
		label: __( 'What is a block?' ),
		icon: helpFilled,
		view: <IntroToBlocks />,
	},
	{
		label: __( 'Add blocks' ),
		icon: plusCircleFilled,
		view: <AddBlocks />,
	},
	{ label: __( 'Move blocks' ), icon: alignJustifyAlt, view: <MoveBlocks /> },
	{ label: __( 'Remove blocks' ), icon: trashFilled, view: <RemoveBlocks /> },
	{
		label: __( 'Customize blocks' ),
		icon: cogAlt,
		view: <CustomizeBlocks />,
	},
];

function EditorHelpTopics( { isVisible, onClose } ) {
	const bottomSheetHeaderTitleStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetHeaderTitle,
		styles.bottomSheetHeaderTitleDark
	);
	const separatorStyle = usePreferredColorSchemeStyle(
		styles.separator,
		styles.separatorDark
	);

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			hideHeader
			hasNavigation
			contentStyle={ styles.contentContainer }
		>
			<BottomSheetConsumer>
				{ ( { listProps } ) => {
					const contentContainerStyle = StyleSheet.flatten(
						listProps.contentContainerStyle
					);
					return (
						<BottomSheet.NavigationContainer animate main>
							<BottomSheet.NavigationScreen
								isScrollable
								fullScreen
								name="help-topics"
							>
								<View style={ styles.container }>
									<View style={ styles.bottomSheetHeader }>
										<Text
											accessibilityRole="header"
											style={
												bottomSheetHeaderTitleStyle
											}
											maxFontSizeMultiplier={ 3 }
										>
											{ __( 'How to edit your site' ) }
										</Text>
									</View>
									<View style={ separatorStyle } />
									<ScrollView
										{ ...listProps }
										contentContainerStyle={ {
											...contentContainerStyle,
											paddingBottom: Math.max(
												listProps.safeAreaBottomInset,
												contentContainerStyle.paddingBottom
											),
											/**
											 * Remove margin set via `hideHeader`. Combining a header
											 * and navigation in this bottom sheet is at odds with the
											 * current `BottomSheet` implementation.
											 */
											marginTop: 0,
										} }
									>
										<PanelBody title={ __( 'The basics' ) }>
											{ /* Print out help topics */ }
											{ HELP_TOPICS.map(
												( { label, icon } ) => {
													const labelSlug = kebabCase(
														label
													);
													return (
														<HelpTopicRow
															icon={ icon }
															key={ labelSlug }
															label={ label }
															screenName={
																labelSlug
															}
														/>
													);
												}
											) }
										</PanelBody>
									</ScrollView>
								</View>
							</BottomSheet.NavigationScreen>
							{ /* Print out help detail screens */ }
							{ HELP_TOPICS.map( ( { view, label } ) => {
								const labelSlug = kebabCase( label );
								return (
									<HelpDetailNavigationScreen
										content={ view }
										key={ labelSlug }
										label={ label }
										name={ labelSlug }
									/>
								);
							} ) }
						</BottomSheet.NavigationContainer>
					);
				} }
			</BottomSheetConsumer>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
