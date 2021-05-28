/**
 * External dependencies
 */
import {
	ActivityIndicator,
	Platform,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	useEntityBlockEditor,
	useEntityProp,
	store as coreStore,
} from '@wordpress/core-data';
import { BottomSheet, Icon, Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	InnerBlocks,
	Warning,
} from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { help } from '@wordpress/icons';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import styles from './editor.scss';
import EditTitle from './edit-title';

export default function ReusableBlockEdit( {
	attributes: { ref },
	clientId,
	isSelected,
} ) {
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		ref
	);

	const [ showHelp, setShowHelp ] = useState( false );
	const infoTextStyle = usePreferredColorSchemeStyle(
		styles.infoText,
		styles.infoTextDark
	);
	const infoTitleStyle = usePreferredColorSchemeStyle(
		styles.infoTitle,
		styles.infoTitleDark
	);
	const infoSheetIconStyle = usePreferredColorSchemeStyle(
		styles.infoSheetIcon,
		styles.infoSheetIconDark
	);
	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const { hasResolved, isEditing, isMissing } = useSelect(
		( select ) => {
			const persistedBlock = select( coreStore ).getEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			const hasResolvedBlock = select(
				coreStore
			).hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_block',
				ref,
			] );
			return {
				hasResolved: hasResolvedBlock,
				isEditing: select(
					reusableBlocksStore
				).__experimentalIsEditingReusableBlock( clientId ),
				isMissing: hasResolvedBlock && ! persistedBlock,
			};
		},
		[ ref, clientId ]
	);

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ title ] = useEntityProp( 'postType', 'wp_block', 'title', ref );

	function openSheet() {
		setShowHelp( true );
	}

	function closeSheet() {
		setShowHelp( false );
	}

	function renderSheet() {
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
				onClose={ closeSheet }
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
			</BottomSheet>
		);
	}

	if ( hasAlreadyRendered ) {
		return (
			<Warning
				message={ __( 'Block cannot be rendered inside itself.' ) }
			/>
		);
	}

	if ( isMissing ) {
		return (
			<Warning
				message={ __( 'Block has been deleted or is unavailable.' ) }
			/>
		);
	}

	if ( ! hasResolved ) {
		return (
			<View style={ spinnerStyle }>
				<ActivityIndicator animating />
			</View>
		);
	}

	let element = (
		<InnerBlocks
			value={ blocks }
			onChange={ onChange }
			onInput={ onInput }
		/>
	);

	if ( ! isEditing ) {
		element = <Disabled>{ element }</Disabled>;
	}

	return (
		<RecursionProvider>
			<TouchableWithoutFeedback
				disabled={ ! isSelected }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ openSheet }
			>
				<View>
					{ isSelected && <EditTitle title={ title } /> }
					{ element }
					{ renderSheet() }
				</View>
			</TouchableWithoutFeedback>
		</RecursionProvider>
	);
}
