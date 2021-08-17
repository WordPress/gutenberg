/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import { ScrollView, StyleSheet, View } from 'react-native';
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
	alignJustifyAlt,
	trashFilled,
	cogAlt,
} from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import HelpDetailNavigationScreen from './help-detail-navigation-screen';
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

function EditorHelpTopics( { close, isVisible, onClose } ) {
	const { postType } = useSelect( ( select ) => ( {
		postType: select( editorStore ).getEditedPostAttribute( 'type' ),
	} ) );

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			hideHeader
			hasNavigation
			contentStyle={ styles.contentContainer }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen
					isScrollable
					fullScreen
					name="help-topics"
				>
					<View style={ styles.container }>
						<BottomSheet.NavigationHeader
							isFullscreen
							leftButtonOnPress={ close }
							leftButtonText={ __( 'Close' ) }
							screen={
								postType === 'page'
									? __( 'How to edit your page' )
									: __( 'How to edit your post' )
							}
						/>
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
											{ /* Print out help topics */ }
											{ HELP_TOPICS.map(
												( { label, icon } ) => {
													const labelSlug = kebabCase(
														label
													);
													return (
														<HelpTopicRow
															key={ labelSlug }
															label={ label }
															icon={ icon }
															screenName={
																labelSlug
															}
														/>
													);
												}
											) }
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
								gestureEnabled: true,
								...TransitionPresets.DefaultTransition,
							} }
						/>
					);
				} ) }
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
