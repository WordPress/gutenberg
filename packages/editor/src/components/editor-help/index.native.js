/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { BottomSheet, PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';
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
import TopicRow from './topic-row.native.js';

function EditorHelpTopics( { isVisible, onClose } ) {
	return useMemo( () => (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			title={ __( 'How to edit your site' ) }
			withHeaderSeparator
		>
			<PanelBody
				title={ __( 'The basics' ) }
				style={ styles.sectionContainer }
			>
				<TopicRow
					// eslint-disable-next-line no-console
					onPress={ () => console.log( 'onPress!' ) }
					label={ __( 'What is a block?' ) }
					icon={ helpFilled }
				/>
				<TopicRow
					// eslint-disable-next-line no-console
					onPress={ () => console.log( 'onPress!' ) }
					label={ __( 'Add blocks' ) }
					icon={ plusCircleFilled }
				/>
				<TopicRow
					// eslint-disable-next-line no-console
					onPress={ () => console.log( 'onPress!' ) }
					label={ __( 'Move blocks' ) }
					icon={ alignJustifyAlt }
				/>
				<TopicRow
					// eslint-disable-next-line no-console
					onPress={ () => console.log( 'onPress!' ) }
					label={ __( 'Remove blocks' ) }
					icon={ trashFilled }
				/>
				<TopicRow
					// eslint-disable-next-line no-console
					onPress={ () => console.log( 'onPress!' ) }
					label={ __( 'Customize blocks' ) }
					icon={ cogAlt }
				/>
			</PanelBody>
		</BottomSheet>
	) );
}

export default withPreferredColorScheme( EditorHelpTopics );
