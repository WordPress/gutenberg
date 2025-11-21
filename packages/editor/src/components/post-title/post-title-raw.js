/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useState, forwardRef } from '@wordpress/element';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { DEFAULT_CLASSNAMES, REGEXP_NEWLINES } from './constants';
import usePostTitleFocus from './use-post-title-focus';
import usePostTitle from './use-post-title';

/**
 * Renders a raw post title input field.
 *
 * @param {Object}  _            Unused parameter.
 * @param {Element} forwardedRef Reference to the component's DOM node.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostTitleRaw( _, forwardedRef ) {
	const { placeholder } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { titlePlaceholder } = getSettings();

		return {
			placeholder: titlePlaceholder,
		};
	}, [] );

	const collaboratorMode = useSelect( ( select ) => {
		return select( coreDataStore ).getCollaboratorMode();
	}, [] );

	const [ isSelected, setIsSelected ] = useState( false );

	const { title, setTitle: onUpdate } = usePostTitle();
	const { ref: focusRef } = usePostTitleFocus( forwardedRef );

	function onChange( value ) {
		onUpdate( value.replace( REGEXP_NEWLINES, ' ' ) );
	}

	function onSelect() {
		setIsSelected( true );
	}

	function onUnselect() {
		setIsSelected( false );
	}

	// The wp-block className is important for editor styles.
	// This same block is used in both the visual and the code editor.
	const className = clsx( DEFAULT_CLASSNAMES, {
		'is-selected': isSelected,
		'is-raw-text': true,
	} );

	const decodedPlaceholder =
		decodeEntities( placeholder ) || __( 'Add title' );

	return (
		<TextareaControl
			readOnly={ collaboratorMode === 'view' }
			contentEditable={ collaboratorMode === 'edit' }
			ref={ focusRef }
			value={ title }
			onChange={ onChange }
			onFocus={ onSelect }
			onBlur={ onUnselect }
			label={ placeholder }
			className={ className }
			placeholder={ decodedPlaceholder }
			hideLabelFromVision
			autoComplete="off"
			dir="auto"
			rows={ 1 }
			__nextHasNoMarginBottom
		/>
	);
}

export default forwardRef( PostTitleRaw );
