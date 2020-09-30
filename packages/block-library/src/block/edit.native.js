/**
 * External dependencies
 */
import { Platform, Text, TouchableWithoutFeedback, View } from 'react-native';
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { BottomSheet, Icon, Spinner, Disabled } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { parse } from '@wordpress/blocks';
import { help } from '@wordpress/icons';
import { requestUnsupportedBlockFallback } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './editor.scss';
import EditTitle from './edit-title';

class ReusableBlockEdit extends Component {
	constructor( { reusableBlock } ) {
		super( ...arguments );

		this.setBlocks = this.setBlocks.bind( this );
		this.toggleSheet = this.toggleSheet.bind( this );
		this.requestFallback = this.requestFallback.bind( this );

		if ( reusableBlock ) {
			// Start in edit mode when we're working with a newly created reusable block
			this.state = {
				// Since edition is not supported yet isEditing is always false
				isEditing: false,
				blocks: parse( reusableBlock.content ),
				showHelp: false,
				sendFallbackMessage: false,
			};
		} else {
			// Start in preview mode when we're working with an existing reusable block
			this.state = {
				isEditing: false,
				blocks: [],
				showHelp: false,
				sendFallbackMessage: false,
			};
		}
	}

	componentDidMount() {
		this.props.fetchReusableBlock();
	}

	componentDidUpdate( prevProps ) {
		const hasBlockFetchCompleted =
			! prevProps.reusableBlock && this.props.reusableBlock;
		const hasBlockContentChanged =
			prevProps.reusableBlock?.content !==
			this.props.reusableBlock?.content;

		if ( hasBlockFetchCompleted || hasBlockContentChanged ) {
			this.setState( {
				blocks: parse( this.props.reusableBlock.content ),
			} );
		}
	}

	toggleSheet() {
		this.setState( {
			showHelp: ! this.state.showHelp,
		} );
	}

	requestFallback() {
		this.toggleSheet();
		this.setState( { sendFallbackMessage: true } );
	}

	setBlocks( blocks ) {
		this.setState( { blocks } );
	}

	renderSheet() {
		const { name, reusableBlock } = this.props;
		const { showHelp } = this.state;

		const { getStylesFromColorScheme, clientId } = this.props;
		const infoTextStyle = getStylesFromColorScheme(
			styles.infoText,
			styles.infoTextDark
		);
		const infoTitleStyle = getStylesFromColorScheme(
			styles.infoTitle,
			styles.infoTitleDark
		);
		const infoSheetIconStyle = getStylesFromColorScheme(
			styles.infoSheetIcon,
			styles.infoSheetIconDark
		);
		const actionButtonStyle = getStylesFromColorScheme(
			styles.actionButton,
			styles.actionButtonDark
		);

		const infoTitle =
			Platform.OS === 'android'
				? __(
						"Reusable blocks aren't editable on WordPress for Android"
				  )
				: __( "Reusable blocks aren't editable on WordPress for iOS" );

		return (
			<BottomSheet
				isVisible={ showHelp }
				hideHeader
				onClose={ this.toggleSheet }
				onModalHide={ () => {
					if ( this.state.sendFallbackMessage ) {
						// On iOS, onModalHide is called when the controller is still part of the hierarchy.
						// A small delay will ensure that the controller has already been removed.
						this.timeout = setTimeout( () => {
							requestUnsupportedBlockFallback(
								`<!-- wp:block {"ref":${ reusableBlock.id }} /-->`,
								clientId,
								name,
								reusableBlock.title
							);
						}, 100 );
						this.setState( { sendFallbackMessage: false } );
					}
				} }
			>
				<View style={ styles.infoContainer }>
					<Icon
						icon={ help }
						color={ infoSheetIconStyle.color }
						size={ styles.infoSheetIcon.size }
					/>
					<Text style={ [ infoTextStyle, infoTitleStyle ] }>
						{ infoTitle }
					</Text>
				</View>
				<>
					<BottomSheet.Cell
						label={ __( 'Edit block in web browser' ) }
						separatorType="topFullWidth"
						onPress={ this.requestFallback }
						labelStyle={ actionButtonStyle }
					/>
					<BottomSheet.Cell
						label={ __( 'Dismiss' ) }
						separatorType="topFullWidth"
						onPress={ this.toggleSheet }
						labelStyle={ actionButtonStyle }
					/>
				</>
			</BottomSheet>
		);
	}

	render() {
		const { isSelected, reusableBlock, isFetching, settings } = this.props;
		const { isEditing, blocks } = this.state;

		if ( ! reusableBlock && isFetching ) {
			return <Spinner />;
		}

		if ( ! reusableBlock ) {
			return (
				<Text>
					{ __( 'Block has been deleted or is unavailable.' ) }
				</Text>
			);
		}

		const { title } = reusableBlock;
		let element = (
			<BlockEditorProvider
				settings={ settings }
				value={ blocks }
				onChange={ this.setBlocks }
				onInput={ this.setBlocks }
			>
				<BlockList withFooter={ false } marginHorizontal={ 0 } />
			</BlockEditorProvider>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<TouchableWithoutFeedback
				disabled={ ! isSelected }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ this.toggleSheet }
			>
				<View>
					{ isSelected && <EditTitle title={ title } /> }
					{ element }
					{ this.renderSheet( title ) }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			__experimentalGetReusableBlock: getReusableBlock,
			__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
			__experimentalIsSavingReusableBlock: isSavingReusableBlock,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );
		const { __experimentalGetParsedReusableBlock, getSettings } = select(
			'core/block-editor'
		);
		const { ref } = ownProps.attributes;
		const reusableBlock = getReusableBlock( ref );

		return {
			reusableBlock,
			isFetching: isFetchingReusableBlock( ref ),
			isSaving: isSavingReusableBlock( ref ),
			blocks: reusableBlock
				? __experimentalGetParsedReusableBlock( reusableBlock.id )
				: null,
			canUpdateBlock:
				!! reusableBlock &&
				! reusableBlock.isTemporary &&
				!! canUser( 'update', 'blocks', ref ),
			settings: getSettings(),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			__experimentalConvertBlockToStatic: convertBlockToStatic,
			__experimentalFetchReusableBlocks: fetchReusableBlocks,
			__experimentalUpdateReusableBlock: updateReusableBlock,
			__experimentalSaveReusableBlock: saveReusableBlock,
		} = dispatch( 'core/editor' );
		const { ref } = ownProps.attributes;

		return {
			fetchReusableBlock: partial( fetchReusableBlocks, ref ),
			onChange: partial( updateReusableBlock, ref ),
			onSave: partial( saveReusableBlock, ref ),
			convertToStatic() {
				convertBlockToStatic( ownProps.clientId );
			},
		};
	} ),
	withPreferredColorScheme,
] )( ReusableBlockEdit );
