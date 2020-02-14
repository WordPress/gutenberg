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
	SelectControl,
	RangeControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import {
	DEFAULT_SHOW_POST_CONTENT,
	DEFAULT_POST_CONTENT_RADIO,
	DEFAULT_DISPLAY_POST_DATE,
	DEFAULT_EXCERPT_LENGTH,
	MIN_EXCERPT_LENGTH,
	MAX_EXCERPT_LENGTH,
	DEFAULT_POSTS_TO_SHOW,
} from './constants';

const LatestPostsEdit = ( {
	attributes,
	setAttributes,
	getStylesFromColorScheme,
	name,
} ) => {
	const blockType = coreBlocks[ name ];

	const {
		displayPostContent,
		displayPostContentRadio,
		excerptLength,
		displayPostDate,
	} = attributes;

	const onClearSettings = () => {
		setAttributes( {
			excerptLength: DEFAULT_EXCERPT_LENGTH,
			displayPostContent: DEFAULT_SHOW_POST_CONTENT,
			displayPostContentRadio: DEFAULT_POST_CONTENT_RADIO,
			displayPostDate: DEFAULT_DISPLAY_POST_DATE,
			postsToShow: DEFAULT_POSTS_TO_SHOW,
		} );
	};

	const onSetDisplayPostContent = ( value ) => {
		setAttributes( { displayPostContent: value } );
	};

	const onSetDisplayPostContentRadio = ( value ) => {
		setAttributes( { displayPostContentRadio: value } );
	};

	const onSetExcerptLength = ( value ) => {
		setAttributes( { excerptLength: value } );
	};

	const onSetDisplayPostDate = ( value ) => {
		setAttributes( { displayPostDate: value } );
	};

	const actions = [
		{
			label: __( 'Clear All Settings' ),
			onPress: onClearSettings,
		},
	];

	const getInspectorControls = () => (
		<InspectorControls>
			<PanelBody title={ __( 'Post meta settings' ) }>
				<ToggleControl
					label={ __( 'Display post date' ) }
					checked={ displayPostDate }
					onChange={ onSetDisplayPostDate }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Post Content Settings' ) }>
				<ToggleControl
					label={ __( 'Show Post Content' ) }
					checked={ displayPostContent }
					onChange={ onSetDisplayPostContent }
				/>
				{ displayPostContent && (
					<SelectControl
						label={ __( 'Show' ) }
						value={ displayPostContentRadio }
						onChangeValue={ onSetDisplayPostContentRadio }
						options={ [
							{ label: __( 'Excerpt' ), value: 'excerpt' },
							{
								label: __( 'Full Post' ),
								value: 'full_post',
							},
						] }
					/>
				) }
				{ displayPostContent &&
					displayPostContentRadio === 'excerpt' && (
						<RangeControl
							label={ __( 'Max number of words in excerpt' ) }
							value={ excerptLength }
							onChange={ onSetExcerptLength }
							min={ MIN_EXCERPT_LENGTH }
							max={ MAX_EXCERPT_LENGTH }
						/>
					) }
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
