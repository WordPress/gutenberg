/**
 * External dependencies
 */
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
					const {
						style: containerStyle,
						...scrollViewProps
					} = listProps;
					const contentContainerStyle = StyleSheet.flatten(
						scrollViewProps.contentContainerStyle
					);
					return (
						<BottomSheet.NavigationContainer animate main>
							<BottomSheet.NavigationScreen
								isScrollable
								name={ __( 'Topics' ) }
							>
								<View style={ containerStyle }>
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
										{ ...scrollViewProps }
										contentContainerStyle={ {
											...contentContainerStyle,
											paddingBottom: Math.max(
												scrollViewProps.safeAreaBottomInset,
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
											{ HELP_TOPICS.map( ( topic ) => {
												return (
													<HelpTopicRow
														key={ topic.label }
														label={ topic.label }
														icon={ topic.icon }
														content={ topic.view }
													/>
												);
											} ) }
										</PanelBody>
									</ScrollView>
								</View>
							</BottomSheet.NavigationScreen>
							<BottomSheet.NavigationScreen
								isScrollable
								name={ BottomSheet.SubSheet.screenName }
							>
								<BottomSheet.SubSheet.Slot />
							</BottomSheet.NavigationScreen>
						</BottomSheet.NavigationContainer>
					);
				} }
			</BottomSheetConsumer>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
