/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { coreBlocks } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';
import { fetchRequest } from 'react-native-gutenberg-bridge';
import {
	Icon,
	PanelBody,
	PanelActions,
	ToggleControl,
	SelectControl,
	RangeControl,
	QueryControls,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import {
	DEFAULT_POSTS_TO_SHOW,
	DEFAULT_ORDER,
	DEFAULT_ORDER_BY,
	DEFAULT_SHOW_POST_CONTENT,
	DEFAULT_POST_CONTENT_RADIO,
	DEFAULT_DISPLAY_POST_DATE,
	DEFAULT_EXCERPT_LENGTH,
	MIN_EXCERPT_LENGTH,
	MAX_EXCERPT_LENGTH,
} from './constants';

class LatestPostsEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			categoriesList: [],
		};
	}

	componentDidMount() {
		this.isStillMounted = true;
		this.fetchRequest = fetchRequest( '/wp/v2/categories' )
			.then( ( categoriesList ) => {
				if ( this.isStillMounted ) {
					this.setState( { categoriesList } );
				}
			} )
			.catch( () => {
				if ( this.isStillMounted ) {
					this.setState( { categoriesList: [] } );
				}
			} );
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.isSelected && this.props.isSelected ) {
			this.props.openGeneralSidebar();
		}
	}

	render() {
		const {
			attributes,
			setAttributes,
			getStylesFromColorScheme,
			name,
			openGeneralSidebar,
			isSelected,
		} = this.props;

		const {
			displayPostContent,
			displayPostContentRadio,
			excerptLength,
			displayPostDate,
			order,
			orderBy,
			postsToShow,
			categories,
		} = attributes;

		const { categoriesList } = this.state;
		const blockType = coreBlocks[ name ];

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

		const onClearSettings = () => {
			setAttributes( {
				excerptLength: DEFAULT_EXCERPT_LENGTH,
				displayPostContent: DEFAULT_SHOW_POST_CONTENT,
				displayPostContentRadio: DEFAULT_POST_CONTENT_RADIO,
				displayPostDate: DEFAULT_DISPLAY_POST_DATE,
				order: DEFAULT_ORDER,
				orderBy: DEFAULT_ORDER_BY,
				postsToShow: DEFAULT_POSTS_TO_SHOW,
			} );
		};

		const actions = [
			{
				label: __( 'Clear All Settings' ),
				onPress: onClearSettings,
			},
		];

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

		const onSetOrder = ( value ) => {
			setAttributes( { order: value } );
		};

		const onSetOrderBy = ( value ) => {
			setAttributes( { orderBy: value } );
		};

		const onSetPostsToShow = ( value ) => {
			setAttributes( { postsToShow: value } );
		};

		const onSetCategories = ( value ) => {
			setAttributes( {
				categories: '' !== value ? value.toString() : undefined,
			} );
		};

		const getInspectorControls = () => (
			<InspectorControls>
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

				<PanelBody title={ __( 'Post meta settings' ) }>
					<ToggleControl
						label={ __( 'Display post date' ) }
						checked={ displayPostDate }
						onChange={ onSetDisplayPostDate }
					/>
				</PanelBody>

				<PanelBody title={ __( 'Sorting and filtering' ) }>
					<QueryControls
						{ ...{ order, orderBy } }
						numberOfItems={ postsToShow }
						categoriesList={ categoriesList }
						selectedCategoryId={
							undefined !== categories ? Number( categories ) : ''
						}
						onOrderChange={ onSetOrder }
						onOrderByChange={ onSetOrderBy }
						onCategoryChange={ onSetCategories }
						onNumberOfItemsChange={ onSetPostsToShow }
					/>
				</PanelBody>

				<PanelActions actions={ actions } />
			</InspectorControls>
		);

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				disabled={ ! isSelected }
				onPress={ openGeneralSidebar }
			>
				<View style={ blockStyle }>
					{ getInspectorControls() }
					<Icon icon={ icon } { ...iconStyle } />
					<Text style={ titleStyle }>
						{ blockType.settings.title }
					</Text>
					<Text style={ subTitleStyle }>{ __( 'Configure' ) }</Text>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
		};
	} ),
	withPreferredColorScheme,
] )( LatestPostsEdit );
