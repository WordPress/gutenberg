/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import { Text, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { TransitionPresets } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import {
	BottomSheet,
	BottomSheetConsumer,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	helpFilled,
	plusCircleFilled,
	alignJustify,
	trashFilled,
	cogAlt,
} from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	requestContactCustomerSupport,
	requestGotoCustomerSupportOptions,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import HelpDetailNavigationScreen from './help-detail-navigation-screen';
import HelpTopicRow from './help-topic-row';
import HelpGetSupportButton from './help-get-support-button';
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
	{ label: __( 'Move blocks' ), icon: alignJustify, view: <MoveBlocks /> },
	{ label: __( 'Remove blocks' ), icon: trashFilled, view: <RemoveBlocks /> },
	{
		label: __( 'Customize blocks' ),
		icon: cogAlt,
		view: <CustomizeBlocks />,
	},
];

function EditorHelpTopics( { close, isVisible, onClose } ) {
	const { postType } = useSelect( ( select ) => ( {
		postType: select( editorStore ).getEditedPostAttribute( 'type' ),
	} ) );

	const sectionTitle = usePreferredColorSchemeStyle(
		styles.helpDetailSectionHeading,
		styles.helpDetailSectionHeadingDark
	);

	const title =
		postType === 'page'
			? __( 'How to edit your page' )
			: __( 'How to edit your post' );

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			hideHeader
			hasNavigation
			contentStyle={ styles.contentContainer }
			testID="editor-help-modal"
		>
			<SafeAreaView>
				<BottomSheet.NavigationContainer
					animate
					main
					style={ styles.navigationContainer }
				>
					<BottomSheet.NavigationScreen
						isScrollable
						fullScreen
						name="help-topics"
					>
						<View style={ styles.container }>
							<BottomSheet.NavBar>
								<BottomSheet.NavBar.DismissButton
									onPress={ close }
									iosText={ __( 'Close' ) }
								/>
								<BottomSheet.NavBar.Heading>
									{ title }
								</BottomSheet.NavBar.Heading>
							</BottomSheet.NavBar>
							<BottomSheetConsumer>
								{ ( { listProps } ) => {
									const contentContainerStyle = StyleSheet.flatten(
										listProps.contentContainerStyle
									);
									return (
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
											<PanelBody>
												<Text style={ sectionTitle }>
													{ __( 'The basics' ) }
												</Text>
												{ /* Print out help topics */ }
												{ HELP_TOPICS.map(
													( { label, icon } ) => {
														const labelSlug = kebabCase(
															label
														);
														return (
															<HelpTopicRow
																key={
																	labelSlug
																}
																label={ label }
																icon={ icon }
																screenName={
																	labelSlug
																}
															/>
														);
													}
												) }
												{
													<Text
														style={ sectionTitle }
													>
														{ __( 'Get support' ) }
													</Text>
												}
												{
													<HelpGetSupportButton
														title={ __(
															'Contact support'
														) }
														onPress={
															requestContactCustomerSupport
														}
													/>
												}
												{
													<HelpGetSupportButton
														title={ __(
															'More support options'
														) }
														onPress={
															requestGotoCustomerSupportOptions
														}
													/>
												}
											</PanelBody>
										</ScrollView>
									);
								} }
							</BottomSheetConsumer>
						</View>
					</BottomSheet.NavigationScreen>
					{ /* Print out help detail screens */ }
					{ HELP_TOPICS.map( ( { view, label } ) => {
						const labelSlug = kebabCase( label );
						return (
							<HelpDetailNavigationScreen
								key={ labelSlug }
								name={ labelSlug }
								content={ view }
								label={ label }
								options={ {
									gestureEnabled: false,
									...TransitionPresets.DefaultTransition,
								} }
							/>
						);
					} ) }
				</BottomSheet.NavigationContainer>
			</SafeAreaView>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
