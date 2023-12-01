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
import { store as commandsStore } from '@wordpress/commands';
import {
	chevronLeftSmall,
	chevronRightSmall,
	page as pageIcon,
	navigation as navigationIcon,
	symbol,
} from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';
import { store as editSiteStore } from '../../../store';
import {
	TEMPLATE_POST_TYPE,
	NAVIGATION_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_TYPES,
	PATTERN_SYNC_TYPES,
} from '../../../utils/constants';

const typeLabels = {
	[ PATTERN_TYPES.user ]: __( 'Editing pattern:' ),
	[ NAVIGATION_POST_TYPE ]: __( 'Editing navigation menu:' ),
	[ TEMPLATE_POST_TYPE ]: __( 'Editing template:' ),
	[ TEMPLATE_PART_POST_TYPE ]: __( 'Editing template part:' ),
};

export default function DocumentActions() {
	const isPage = useSelect(
		( select ) => select( editSiteStore ).isPage(),
		[]
	);
	return isPage ? <PageDocumentActions /> : <TemplateDocumentActions />;
}

function PageDocumentActions() {
	const { isEditingPage, hasResolved, isFound, title } = useSelect(
		( select ) => {
			const { getEditedPostContext } = select( editSiteStore );
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { getRenderingMode } = select( editorStore );
			const context = getEditedPostContext();
			const queryArgs = [ 'postType', context.postType, context.postId ];
			const page = getEditedEntityRecord( ...queryArgs );
			return {
				isEditingPage:
					!! context.postId && getRenderingMode() !== 'template-only',
				hasResolved: hasFinishedResolution(
					'getEditedEntityRecord',
					queryArgs
				),
				isFound: !! page,
				title: page?.title,
			};
		},
		[]
	);

	const { setRenderingMode } = useDispatch( editorStore );
	const [ isAnimated, setIsAnimated ] = useState( false );
	const isLoading = useRef( true );

	useEffect( () => {
		if ( ! isLoading.current ) {
			setIsAnimated( true );
		}
		isLoading.current = false;
	}, [ isEditingPage ] );

	if ( ! hasResolved ) {
		return null;
	}

	if ( ! isFound ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	return isEditingPage ? (
		<BaseDocumentActions
			className={ classnames( 'is-page', {
				'is-animated': isAnimated,
			} ) }
			icon={ pageIcon }
		>
			{ title }
		</BaseDocumentActions>
	) : (
		<TemplateDocumentActions
			className={ classnames( {
				'is-animated': isAnimated,
			} ) }
			onBack={ () => setRenderingMode( 'template-locked' ) }
		/>
	);
}

function TemplateDocumentActions( { className, onBack } ) {
	const { isLoaded, record, getTitle, icon } = useEditedEntityRecord();

	if ( ! isLoaded ) {
		return null;
	}

	if ( ! record ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	let typeIcon = icon;
	if ( record.type === NAVIGATION_POST_TYPE ) {
		typeIcon = navigationIcon;
	} else if ( record.type === PATTERN_TYPES.user ) {
		typeIcon = symbol;
	}

	return (
		<BaseDocumentActions
			className={ classnames( className, {
				'is-synced-entity':
					record.wp_pattern_sync_status !==
					PATTERN_SYNC_TYPES.unsynced,
			} ) }
			icon={ typeIcon }
			onBack={ onBack }
		>
			<VisuallyHidden as="span">
				{ typeLabels[ record.type ] ??
					typeLabels[ TEMPLATE_POST_TYPE ] }
			</VisuallyHidden>
			{ getTitle() }
		</BaseDocumentActions>
	);
}

function BaseDocumentActions( { className, icon, children, onBack } ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	return (
		<div
			className={ classnames( 'edit-site-document-actions', className ) }
		>
			{ onBack && (
				<Button
					className="edit-site-document-actions__back"
					icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
					onClick={ ( event ) => {
						event.stopPropagation();
						onBack();
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			<Button
				className="edit-site-document-actions__command"
				onClick={ () => openCommandCenter() }
				size="compact"
			>
				<HStack
					className="edit-site-document-actions__title"
					spacing={ 1 }
					justify="center"
				>
					<BlockIcon icon={ icon } />
					<Text size="body" as="h1">
						{ children }
					</Text>
				</HStack>
				<span className="edit-site-document-actions__shortcut">
					{ displayShortcut.primary( 'k' ) }
				</span>
			</Button>
		</div>
	);
}
