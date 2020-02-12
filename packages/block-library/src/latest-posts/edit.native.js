/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';
import {
	Icon,
	PanelBody,
	PanelActions,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const LatestPostsEdit = ( {
	attributes,
	setAttributes,
	getStylesFromColorScheme,
	name,
} ) => {
	const onClearSettings = () => {
		setAttributes( {
			displayPostContent: attributes.displayPostContent.default,
		} );
	};

	const onSetDisplayPostContent = ( value ) => {
		setAttributes( { displayPostContent: value } );
	};

	const blockType = coreBlocks[ name ];

	const { displayPostContent } = attributes;

	const actions = [
		{
			label: __( 'Clear All Settings' ),
			onPress: onClearSettings,
		},
	];

	const getInspectorControls = () => (
		<InspectorControls>
			<PanelBody title={ __( 'Latest posts settings' ) }>
				<ToggleControl
					label={ __( 'Show Post Content' ) }
					checked={ displayPostContent }
					onChange={ onSetDisplayPostContent }
				/>
			</PanelBody>
			<PanelActions actions={ actions } />
		</InspectorControls>
	);

	const blockStyle = getStylesFromColorScheme(
		styles.latestPostBlock,
		styles.latestPostBlockDark
	);

	const iconStyle = getStylesFromColorScheme(
		styles.latestPostBlockIcon,
		styles.latestPostBlockIconDark
	);

	const titleStyle = getStylesFromColorScheme(
		styles.latestPostBlockMessage,
		styles.latestPostBlockMessageDark
	);

	const subTitleStyle = getStylesFromColorScheme(
		styles.latestPostBlockSubtitle,
		styles.latestPostBlockSubtitleDark
	);

	return (
		<View style={ blockStyle }>
			{ getInspectorControls() }
			<Icon icon={ icon } { ...iconStyle } />
			<Text style={ titleStyle }>{ blockType.settings.title }</Text>
			<Text style={ subTitleStyle }>{ __( 'Configure' ) }</Text>
		</View>
	);
};

export default withPreferredColorScheme( LatestPostsEdit );
