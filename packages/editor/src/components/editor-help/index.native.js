/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
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
import HelpTopicRow from './help-topic-row.native.js';

const HELP_TOPICS = [
	{ label: __( 'What is a block?' ), icon: helpFilled },
	{ label: __( 'Add blocks' ), icon: plusCircleFilled },
	{ label: __( 'Move blocks' ), icon: alignJustifyAlt },
	{ label: __( 'Remove blocks' ), icon: trashFilled },
	{ label: __( 'Customize blocks' ), icon: cogAlt },
];

function EditorHelpTopics( { isVisible, onClose } ) {
	const bottomSheetHeaderTitleStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetHeaderTitle,
		styles.bottomSheetHeaderTitleDark
	);

	return useMemo( () => (
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
									label={ topic.label }
									icon={ topic.icon }
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
	) );
}

export default EditorHelpTopics;
