/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	VisuallyHidden,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import {
	chevronLeftSmall,
	chevronRightSmall,
	page as pageIcon,
	navigation as navigationIcon,
	symbol,
} from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { useEntityRecord } from '@wordpress/core-data';
import { store as commandsStore } from '@wordpress/commands';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const typeLabels = {
	wp_pattern: __( 'Editing pattern:' ),
	wp_navigation: __( 'Editing navigation menu:' ),
	wp_template: __( 'Editing template:' ),
	wp_template_part: __( 'Editing template part:' ),
};

const icons = {
	wp_block: symbol,
	wp_navigation: navigationIcon,
};

export default function DocumentBar() {
	const { isEditingTemplate, templateId, postType, postId } = useSelect(
		( select ) => {
			const {
				getRenderingMode,
				getCurrentTemplateId,
				getCurrentPostId,
				getCurrentPostType,
			} = select( editorStore );
			const _templateId = getCurrentTemplateId();
			return {
				isEditingTemplate:
					!! _templateId && getRenderingMode() === 'template-only',
				templateId: _templateId,
				postType: getCurrentPostType(),
				postId: getCurrentPostId(),
			};
		},
		[]
	);
	const { getEditorSettings } = useSelect( editorStore );
	const { setRenderingMode } = useDispatch( editorStore );

	return (
		<BaseDocumentActions
			postType={ isEditingTemplate ? 'wp_template' : postType }
			postId={ isEditingTemplate ? templateId : postId }
			onBack={
				isEditingTemplate
					? () =>
							setRenderingMode(
								getEditorSettings().defaultRenderingMode
							)
					: undefined
			}
		/>
	);
}

function BaseDocumentActions( { postType, postId, onBack } ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	const { editedRecord: document, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);
	const isNotFound = ! document && ! isResolving;
	const icon = icons[ postType ] ?? pageIcon;
	const [ isAnimated, setIsAnimated ] = useState( false );
	const isMounting = useRef( true );

	useEffect( () => {
		if ( ! isMounting.current ) {
			setIsAnimated( true );
		}
		isMounting.current = false;
	}, [ postType, postId ] );

	return (
		<div
			className={ classnames( 'editor-document-bar', {
				'has-back-button': !! onBack,
				'is-animated': isAnimated,
			} ) }
		>
			{ onBack && (
				<Button
					className="editor-document-bar__back"
					icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
					onClick={ ( event ) => {
						event.stopPropagation();
						onBack();
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			{ isNotFound && <Text>{ __( 'Document not found' ) }</Text> }
			{ ! isNotFound && (
				<Button
					className="editor-document-bar__command"
					onClick={ () => openCommandCenter() }
				>
					<HStack
						className="editor-document-bar__title"
						spacing={ 1 }
						justify="center"
					>
						<BlockIcon icon={ icon } />
						<Text size="body" as="h1">
							{ typeLabels[ postType ] && (
								<VisuallyHidden as="span">
									{ typeLabels[ postType ] }
								</VisuallyHidden>
							) }
							{ document.title }
						</Text>
					</HStack>
					<span className="edit-site-document-actions__shortcut">
						{ displayShortcut.primary( 'k' ) }
					</span>
				</Button>
			) }
		</div>
	);
}
