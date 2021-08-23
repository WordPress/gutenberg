/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, PanelBody } from '@wordpress/components';
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

function EditorHelpTopics( { isVisible, onClose } ) {
	const bottomSheetHeaderTitleStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetHeaderTitle,
		styles.bottomSheetHeaderTitleDark
	);

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			hideHeader
			hasNavigation
			contentStyle={ styles.contentContainer }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen name={ __( 'Topics' ) }>
					<View style={ styles.bottomSheetHeader }>
						<Text
							style={ bottomSheetHeaderTitleStyle }
							maxFontSizeMultiplier={ 3 }
						>
							{ __( 'How to edit your site' ) }
						</Text>
					</View>
					<View style={ styles.separator } />
					<PanelBody
						title={ __( 'The basics' ) }
						style={ styles.sectionContainer }
					>
						{ /* Print out help topics */ }
						{ HELP_TOPICS.map( ( topic ) => {
							return (
								<HelpTopicRow
									key={ topic.label }
									label={ topic.label }
									icon={ topic.icon }
								/>
							);
						} ) }
					</PanelBody>
				</BottomSheet.NavigationScreen>
				{ /* Print out help detail screens */ }
				{ HELP_TOPICS.map( ( topic ) => {
					return (
						<HelpDetailNavigationScreen
							key={ topic.label }
							name={ topic.label }
							content={ topic.view }
						/>
					);
				} ) }
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
