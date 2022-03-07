/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View, Text } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import {
	Icon,
	PanelBody,
	ToggleControl,
	RangeControl,
	QueryControls,
} from '@wordpress/components';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { MIN_EXCERPT_LENGTH, MAX_EXCERPT_LENGTH } from './constants';

class LatestPostsEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			categoriesList: [],
		};
		this.onSetDisplayPostContent = this.onSetDisplayPostContent.bind(
			this
		);
		this.onSetDisplayPostContentRadio = this.onSetDisplayPostContentRadio.bind(
			this
		);
		this.onSetExcerptLength = this.onSetExcerptLength.bind( this );
		this.onSetDisplayPostDate = this.onSetDisplayPostDate.bind( this );
		this.onSetDisplayFeaturedImage = this.onSetDisplayFeaturedImage.bind(
			this
		);
		this.onSetAddLinkToFeaturedImage = this.onSetAddLinkToFeaturedImage.bind(
			this
		);
		this.onSetOrder = this.onSetOrder.bind( this );
		this.onSetOrderBy = this.onSetOrderBy.bind( this );
		this.onSetPostsToShow = this.onSetPostsToShow.bind( this );
		this.onSetCategories = this.onSetCategories.bind( this );
		this.getInspectorControls = this.getInspectorControls.bind( this );
	}

	componentDidMount() {
		this.isStillMounted = true;
		this.fetchRequest = apiFetch( { path: '/wp/v2/categories' } )
			.then( ( categoriesList ) => {
				if ( this.isStillMounted ) {
					this.setState( {
						categoriesList: isEmpty( categoriesList )
							? []
							: categoriesList,
					} );
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

	onSetDisplayPostContent( value ) {
		const { setAttributes } = this.props;
		setAttributes( { displayPostContent: value } );
	}

	onSetDisplayPostContentRadio( value ) {
		const { setAttributes } = this.props;
		setAttributes( {
			displayPostContentRadio: value ? 'excerpt' : 'full_post',
		} );
	}

	onSetExcerptLength( value ) {
		const { setAttributes } = this.props;
		setAttributes( { excerptLength: value } );
	}

	onSetDisplayPostDate( value ) {
		const { setAttributes } = this.props;
		setAttributes( { displayPostDate: value } );
	}

	onSetDisplayFeaturedImage( value ) {
		const { setAttributes } = this.props;
		setAttributes( { displayFeaturedImage: value } );
	}

	onSetAddLinkToFeaturedImage( value ) {
		const { setAttributes } = this.props;
		setAttributes( { addLinkToFeaturedImage: value } );
	}

	onSetOrder( value ) {
		const { setAttributes } = this.props;
		setAttributes( { order: value } );
	}

	onSetOrderBy( value ) {
		const { setAttributes } = this.props;
		setAttributes( { orderBy: value } );
	}

	onSetPostsToShow( value ) {
		const { setAttributes } = this.props;
		setAttributes( { postsToShow: value } );
	}

	onSetCategories( value ) {
		const { setAttributes } = this.props;
		setAttributes( {
			categories: '' !== value ? value.toString() : undefined,
		} );
	}

	getInspectorControls() {
		const { attributes } = this.props;
		const {
			displayPostContent,
			displayPostContentRadio,
			excerptLength,
			displayPostDate,
			displayFeaturedImage,
			addLinkToFeaturedImage,
			order,
			orderBy,
			postsToShow,
			categories,
		} = attributes;

		const { categoriesList } = this.state;
		const displayExcerptPostContent = displayPostContentRadio === 'excerpt';

		return (
			<InspectorControls>
				<PanelBody title={ __( 'Post content settings' ) }>
					<ToggleControl
						label={ __( 'Show post content' ) }
						checked={ displayPostContent }
						onChange={ this.onSetDisplayPostContent }
					/>
					{ displayPostContent && (
						<ToggleControl
							label={ __( 'Only show excerpt' ) }
							checked={ displayExcerptPostContent }
							onChange={ this.onSetDisplayPostContentRadio }
						/>
					) }
					{ displayPostContent && displayExcerptPostContent && (
						<RangeControl
							label={ __( 'Excerpt length (words)' ) }
							value={ excerptLength }
							onChange={ this.onSetExcerptLength }
							min={ MIN_EXCERPT_LENGTH }
							max={ MAX_EXCERPT_LENGTH }
						/>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Post meta settings' ) }>
					<ToggleControl
						label={ __( 'Display post date' ) }
						checked={ displayPostDate }
						onChange={ this.onSetDisplayPostDate }
					/>
				</PanelBody>

				<PanelBody title={ __( 'Featured image settings' ) }>
					<ToggleControl
						label={ __( 'Display featured image' ) }
						checked={ displayFeaturedImage }
						onChange={ this.onSetDisplayFeaturedImage }
					/>
					{ displayFeaturedImage && (
						<>
							<ToggleControl
								label={ __( 'Add link to featured image' ) }
								checked={ addLinkToFeaturedImage }
								onChange={ this.onSetAddLinkToFeaturedImage }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Sorting and filtering' ) }>
					<QueryControls
						{ ...{ order, orderBy } }
						numberOfItems={ postsToShow }
						categoriesList={ categoriesList }
						selectedCategoryId={
							undefined !== categories ? Number( categories ) : ''
						}
						onOrderChange={ this.onSetOrder }
						onOrderByChange={ this.onSetOrderBy }
						onCategoryChange={
							// eslint-disable-next-line no-undef
							__DEV__ ? this.onSetCategories : undefined
						}
						onNumberOfItemsChange={ this.onSetPostsToShow }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}

	render() {
		const {
			blockTitle,
			getStylesFromColorScheme,
			openGeneralSidebar,
			isSelected,
		} = this.props;

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

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				disabled={ ! isSelected }
				onPress={ openGeneralSidebar }
			>
				<View style={ blockStyle }>
					{ isSelected && this.getInspectorControls() }
					<Icon icon={ icon } { ...iconStyle } />
					<Text style={ titleStyle }>{ blockTitle }</Text>
					<Text style={ styles.latestPostBlockSubtitle }>
						{ __( 'CUSTOMIZE' ) }
					</Text>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, { name } ) => {
		const blockType = select( blocksStore ).getBlockType( name );
		return {
			blockTitle: blockType?.title || name,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
		};
	} ),
	withPreferredColorScheme,
] )( LatestPostsEdit );
