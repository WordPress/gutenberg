/**
 * External dependencies
 */
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useEntityBlockEditor, useEntityProp } from '@wordpress/core-data';
import {
	Disabled,
	ToolbarGroup,
	ToolbarButton,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { ungroup } from '@wordpress/icons';

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
	const recordArgs = [ 'postType', 'wp_block', ref ];

	const [ isEditing, setIsEditing ] = useState( false );

	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const { reusableBlock, hasResolved, isSaving } = useSelect(
		( select ) => {
			const { getSettings } = select( 'core/block-editor' );

			return {
				reusableBlock: select( 'core' ).getEditedEntityRecord(
					...recordArgs
				),
				hasResolved: select( 'core' ).hasFinishedResolution(
					'getEditedEntityRecord',
					recordArgs
				),
				isSaving: select( 'core' ).isSavingEntityRecord(
					...recordArgs
				),
				settings: getSettings(),
			};
		},
		[ ref, clientId ]
	);

	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ title, editTitle ] = useEntityProp(
		'postType',
		'wp_block',
		'title',
		ref
	);

	const setTitle = ( value ) => {
		editTitle( value );
		setIsEditing( true );
	};

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( reusableBlocksStore );

	if ( ! hasResolved || isSaving ) {
		return (
			<View style={ spinnerStyle }>
				<ActivityIndicator animating />
			</View>
		);
	}

	if ( ! reusableBlock ) {
		return (
			<Text>{ __( 'Block has been deleted or is unavailable.' ) }</Text>
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
		<View>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () => convertBlockToStatic( clientId ) }
						label={ __( 'Convert to regular blocks' ) }
						icon={ ungroup }
						showTooltip
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody>
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
					/>
				</PanelBody>
			</InspectorControls>
			<View>
				{ isSelected && (
					<EditTitle
						isEditing={ isEditing }
						onClickEdit={ () => {
							setIsEditing( true );
						} }
						onClickSave={ () => {
							saveEditedEntityRecord( ...recordArgs );
							setIsEditing( false );
						} }
					/>
				) }
				{ element }
			</View>
		</View>
	);
}
