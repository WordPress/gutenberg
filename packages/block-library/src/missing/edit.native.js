/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject, rawHandler, serialize } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { help, plugins } from '@wordpress/icons';
import { withSelect, withDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import {
	UnsupportedBlockDetails,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { requestUnsupportedBlockFallback } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style.scss';

// Blocks that can't be edited through the Unsupported block editor identified by their name.
const UBE_INCOMPATIBLE_BLOCKS = [ 'core/block' ];
const I18N_BLOCK_SCHEMA_TITLE = 'block title';

const EMPTY_ARRAY = [];

export class UnsupportedBlockEdit extends Component {
	constructor( props ) {
		super( props );
		this.state = { showHelp: false };
		this.toggleSheet = this.toggleSheet.bind( this );
		this.closeSheet = this.closeSheet.bind( this );
		this.requestFallback = this.requestFallback.bind( this );
		this.onHelpButtonPressed = this.onHelpButtonPressed.bind( this );
	}

	toggleSheet() {
		const { attributes, block, clientId } = this.props;
		const { originalName } = attributes;
		const title = this.getTitle();
		const blockContent = serialize( block ? [ block ] : [] );

		if ( this.canEditUnsupportedBlock() ) {
			requestUnsupportedBlockFallback(
				blockContent,
				clientId,
				originalName,
				title
			);
			return;
		}

		this.setState( {
			showHelp: ! this.state.showHelp,
		} );
	}

	canEditUnsupportedBlock() {
		const {
			canEnableUnsupportedBlockEditor,
			isUnsupportedBlockEditorSupported,
		} = this.props;

		return (
			! canEnableUnsupportedBlockEditor &&
			isUnsupportedBlockEditorSupported
		);
	}

	closeSheet() {
		this.setState( {
			showHelp: false,
		} );
	}

	componentWillUnmount() {
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
	}

	getTitle() {
		const { originalName } = this.props.attributes;
		const blockType = coreBlocks[ originalName ];
		const title = blockType?.metadata.title;
		const textdomain = blockType?.metadata.textdomain;

		return title && textdomain
			? // eslint-disable-next-line @wordpress/i18n-no-variables, @wordpress/i18n-text-domain
			  _x( title, I18N_BLOCK_SCHEMA_TITLE, textdomain )
			: originalName;
	}

	renderHelpIcon() {
		const infoIconStyle = this.props.getStylesFromColorScheme(
			styles.infoIcon,
			styles.infoIconDark
		);

		return (
			<TouchableOpacity
				onPress={ this.onHelpButtonPressed }
				style={ styles.helpIconContainer }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole="button"
				accessibilityHint={ __( 'Tap here to show help' ) }
			>
				<Icon
					className="unsupported-icon-help"
					label={ __( 'Help icon' ) }
					icon={ help }
					fill={ infoIconStyle.color }
				/>
			</TouchableOpacity>
		);
	}

	onHelpButtonPressed() {
		if ( ! this.props.isSelected ) {
			this.props.selectBlock();
		}
		this.toggleSheet();
	}

	requestFallback() {
		if (
			this.props.canEnableUnsupportedBlockEditor &&
			this.props.isUnsupportedBlockEditorSupported === false
		) {
			this.toggleSheet();
			this.setState( { sendButtonPressMessage: true } );
		} else {
			this.toggleSheet();
			this.setState( { sendFallbackMessage: true } );
		}
	}

	renderSheet( blockTitle, blockName ) {
		const { block, clientId, createSuccessNotice, replaceBlocks } =
			this.props;
		const { showHelp } = this.state;

		/* translators: Missing block alert title. %s: The localized block name */
		const titleFormat = __( "'%s' is not fully-supported" );
		const title = sprintf( titleFormat, blockTitle );
		let description = applyFilters(
			'native.missing_block_detail',
			__( 'We are working hard to add more blocks with each release.' ),
			blockName
		);
		let customActions = EMPTY_ARRAY;

		// For Classic blocks, we offer the alternative to convert the content to blocks.
		if ( blockName === 'core/freeform' ) {
			description +=
				' ' +
				__( 'Alternatively, you can convert the content to blocks.' );
			/* translators: displayed right after the classic block is converted to blocks. %s: The localized classic block name */
			const successNotice = __( "'%s' block converted to blocks" );
			customActions = [
				{
					label: __( 'Convert to blocks' ),
					onPress: () => {
						createSuccessNotice(
							sprintf( successNotice, blockTitle )
						);
						replaceBlocks( block );
					},
				},
			];
		}

		return (
			<UnsupportedBlockDetails
				clientId={ clientId }
				showSheet={ showHelp }
				onCloseSheet={ this.closeSheet }
				customBlockTitle={ blockTitle }
				title={ title }
				description={ description }
				customActions={ customActions }
			/>
		);
	}

	render() {
		const { originalName } = this.props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = this.props;
		const blockType = coreBlocks[ originalName ];

		const title = this.getTitle();
		const titleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockMessage,
			styles.unsupportedBlockMessageDark
		);

		const subTitleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockSubtitle,
			styles.unsupportedBlockSubtitleDark
		);

		const subtitle = (
			<Text style={ subTitleStyle }>
				{ this.canEditUnsupportedBlock()
					? __( 'Tap to edit' )
					: __( 'Unsupported' ) }
			</Text>
		);

		const icon = blockType
			? normalizeIconObject( blockType.settings.icon )
			: plugins;
		const iconStyle = getStylesFromColorScheme(
			styles.unsupportedBlockIcon,
			styles.unsupportedBlockIconDark
		);
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<TouchableOpacity
				activeOpacity={ 0.5 }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole="button"
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ this.toggleSheet }
			>
				<View
					style={ getStylesFromColorScheme(
						styles.unsupportedBlock,
						styles.unsupportedBlockDark
					) }
				>
					{ ! this.canEditUnsupportedBlock() &&
						this.renderHelpIcon() }
					<View style={ styles.unsupportedBlockHeader }>
						<Icon
							className={ iconClassName }
							icon={ icon && icon.src ? icon.src : icon }
							fill={ iconStyle.color }
						/>
						<Text style={ titleStyle }>{ title }</Text>
					</View>
					{ subtitle }
					{ this.renderSheet( title, originalName ) }
				</View>
			</TouchableOpacity>
		);
	}
}

export default compose( [
	withSelect( ( select, { attributes, clientId } ) => {
		const { getBlock, getSettings } = select( blockEditorStore );
		const { capabilities } = getSettings();
		return {
			isUnsupportedBlockEditorSupported:
				capabilities?.unsupportedBlockEditor === true,
			canEnableUnsupportedBlockEditor:
				capabilities?.canEnableUnsupportedBlockEditor === true,
			isEditableInUnsupportedBlockEditor:
				! UBE_INCOMPATIBLE_BLOCKS.includes( attributes.originalName ),
			block: getBlock( clientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { selectBlock, replaceBlocks } = dispatch( blockEditorStore );
		const { createSuccessNotice } = dispatch( noticesStore );
		return {
			selectBlock() {
				selectBlock( ownProps.clientId );
			},
			replaceBlocks( block ) {
				replaceBlocks(
					ownProps.clientId,
					rawHandler( { HTML: serialize( block ) } )
				);
			},
			createSuccessNotice,
		};
	} ),
	withPreferredColorScheme,
] )( UnsupportedBlockEdit );
