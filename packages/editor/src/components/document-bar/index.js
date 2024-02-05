/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
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
	// translators: 1: Pattern title.
	wp_pattern: __( 'Editing pattern: %s' ),
	// translators: 1: Navigation menu title.
	wp_navigation: __( 'Editing navigation menu: %s' ),
	// translators: 1: Template title.
	wp_template: __( 'Editing template: %s' ),
	// translators: 1: Template part title.
	wp_template_part: __( 'Editing template part: %s' ),
};

const icons = {
	wp_block: symbol,
	wp_navigation: navigationIcon,
};

export default function DocumentBar() {
	const { postType, postId, goBack } = useSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostType,
			getEditorSettings: getSettings,
		} = select( editorStore );
		const back = getSettings().goBack;
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			goBack: typeof back === 'function' ? back : undefined,
			getEditorSettings: getSettings,
		};
	}, [] );

	const handleOnBack = () => {
		if ( goBack ) {
			goBack();
		}
	};

	return (
		<BaseDocumentActions
			postType={ postType }
			postId={ postId }
			onBack={ goBack ? handleOnBack : undefined }
		/>
	);
}

function BaseDocumentActions( { postType, postId, onBack } ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	const { editedRecord: doc, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);
	const { templateIcon, templateTitle } = useSelect( ( select ) => {
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );
		const templateInfo = getTemplateInfo( doc );
		return {
			templateIcon: templateInfo.icon,
			templateTitle: templateInfo.title,
		};
	} );
	const isNotFound = ! doc && ! isResolving;
	const icon = icons[ postType ] ?? pageIcon;
	const [ isAnimated, setIsAnimated ] = useState( false );
	const isMounting = useRef( true );
	const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
		postType
	);
	const isGlobalEntity = [
		'wp_template',
		'wp_navigation',
		'wp_template_part',
		'wp_block',
	].includes( postType );

	useEffect( () => {
		if ( ! isMounting.current ) {
			setIsAnimated( true );
		}
		isMounting.current = false;
	}, [ postType, postId ] );

	const title = isTemplate ? templateTitle : doc.title;

	return (
		<div
			className={ classnames( 'editor-document-bar', {
				'has-back-button': !! onBack,
				'is-animated': isAnimated,
				'is-global': isGlobalEntity,
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
					size="compact"
				>
					{ __( 'Back' ) }
				</Button>
			) }
			{ isNotFound && <Text>{ __( 'Document not found' ) }</Text> }
			{ ! isNotFound && (
				<Button
					className="editor-document-bar__command"
					onClick={ () => openCommandCenter() }
					size="compact"
				>
					<HStack
						className="editor-document-bar__title"
						spacing={ 1 }
						justify="center"
					>
						<BlockIcon icon={ isTemplate ? templateIcon : icon } />
						<Text
							size="body"
							as="h1"
							aria-label={
								typeLabels[ postType ]
									? // eslint-disable-next-line @wordpress/valid-sprintf
									  sprintf( typeLabels[ postType ], title )
									: undefined
							}
						>
							{ title }
						</Text>
					</HStack>
					<span className="editor-document-bar__shortcut">
						{ displayShortcut.primary( 'k' ) }
					</span>
				</Button>
			) }
		</div>
	);
}
