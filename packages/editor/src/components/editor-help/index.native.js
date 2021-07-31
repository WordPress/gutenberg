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
import HelpTopicRow from './help-topic-row.native';
import IntroToBlocks from './intro-to-blocks.native';
import AddBlocks from './add-blocks.native';
import MoveBlocks from './move-blocks.native';
import RemoveBlocks from './remove-blocks.native';
import CustomizeBlocks from './customize-blocks.native';

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
			contentStyle={ styles.contentContainer }
			hideHeader
			hasNavigation
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
									topic={ topic }
								/>
							);
						} ) }
					</PanelBody>
				</BottomSheet.NavigationScreen>
				{ /* Print out help detail screens */ }
				<BottomSheet.NavigationScreen
					name={ BottomSheet.SubSheet.screenName }
				>
					<BottomSheet.SubSheet.Slot />
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}

export default EditorHelpTopics;
