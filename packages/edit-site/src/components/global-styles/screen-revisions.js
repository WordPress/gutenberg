/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalUseNavigator as useNavigator,
	Modal,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	useContext,
	useCallback,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { dateI18n, getDate, humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { unlock } from '../../private-apis';
import Revisions from '../revisions';
import SidebarFixedBottom from '../sidebar-edit-mode/sidebar-fixed-bottom';
import { store as editSiteStore } from '../../store';

const { GlobalStylesContext, isGlobalStyleConfigEqual } = unlock(
	blockEditorPrivateApis
);

const SITE_EDITOR_AUTHORS_QUERY = {
	per_page: -1,
	_fields: 'id,name,avatar_urls',
	context: 'view',
	capabilities: [ 'edit_theme_options' ],
};

function getRevisionLabel( revision, isLatest, isUnsaved ) {
	const authorDisplayName = revision?.author?.name;

	if ( isUnsaved ) {
		return sprintf(
			/* translators: %(name)s author display name */
			__( 'Unsaved changes by %(name)s' ),
			{
				name: authorDisplayName,
			}
		);
	}
	const date = getDate( revision?.modified );
	const formattedDate = dateI18n(
		// translators: a compact version of the revision's modified date.
		_x( 'j M @ H:i', 'formatted version of revision last modified date' ),
		date
	);

	return isLatest
		? sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Revision from %(date)s by %(name)s (current)' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  )
		: sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Revision from %(date)s by %(name)s ' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  );
}

function RevisionsButtons( { userRevisions, currentRevisionId, onChange } ) {
	return (
		<ol
			className="edit-site-global-styles-screen-revisions__revisions-list"
			aria-label={ __( 'Global styles revisions' ) }
			role="group"
		>
			{ userRevisions.map( ( revision ) => {
				const { id, author, isLatest, modified } = revision;
				const isUnsaved = 'unsaved' === id;
				/*
				 * If the currentId hasn't been selected yet, the first revision is
				 * the current one so long as the API returns revisions in descending order.
				 */
				const isActive = !! currentRevisionId
					? id === currentRevisionId
					: isLatest;

				const dateHumanTimeDiff = humanTimeDiff( modified );

				return (
					<li
						className={ classnames(
							'edit-site-global-styles-screen-revisions__revision-item',
							{
								'is-current': isActive,
							}
						) }
						key={ `user-styles-revision-${ id }` }
					>
						<Button
							className="edit-site-global-styles-screen-revisions__revision-button"
							disabled={ isActive }
							onClick={ () => {
								onChange( revision );
							} }
							aria-label={ getRevisionLabel(
								revision,
								isLatest,
								isUnsaved
							) }
						>
							<span className="edit-site-global-styles-screen-revisions__description">
								{ isUnsaved ? (
									<span>{ __( 'Unsaved changes' ) }</span>
								) : (
									<span>{ __( 'Changes saved' ) }</span>
								) }
								<span className="edit-site-global-styles-screen-revisions__date">
									{ dateHumanTimeDiff }
								</span>
								<span className="edit-site-global-styles-screen-revisions__avatar">
									<img
										alt={ author?.name }
										src={ author?.avatar_urls?.[ '24' ] }
									/>
								</span>
							</span>
						</Button>
					</li>
				);
			} ) }
		</ol>
	);
}

function RestoreGlobalStylesRevisionModal( { onClose, onSubmit } ) {
	return (
		<Modal
			title={ __( 'You have unsaved changes in the editor' ) }
			focusOnMount={ true }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			isDismissible={ false }
			onRequestClose={ onClose }
		>
			<form onSubmit={ onSubmit }>
				<VStack spacing="5">
					<Text as="p">
						{ __(
							'Loading a revision will replace any unsaved changes. Would you like continue?'
						) }
					</Text>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'No' ) }
						</Button>

						<Button variant="primary" type="submit">
							{ __( 'Yes' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

function ScreenRevisions() {
	const { goBack } = useNavigator();
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const {
		authors,
		blocks,
		currentUser,
		userRevisions,
		isDirty,
		editorCanvasContainerView,
		isLoading,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetDirtyEntityRecords,
			getCurrentUser,
			getUsers,
			__experimentalGetCurrentThemeGlobalStylesRevisions,
			isResolving,
		} = select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const _currentUser = getCurrentUser();
		const _isDirty = dirtyEntityRecords.length > 0;
		const _userRevisions =
			__experimentalGetCurrentThemeGlobalStylesRevisions() || [];
		const _authors = getUsers( SITE_EDITOR_AUTHORS_QUERY );

		return {
			authors: _authors,
			currentUser: _currentUser,
			isDirty: _isDirty,
			userRevisions: _userRevisions,
			editorCanvasContainerView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			blocks: select( blockEditorStore ).getBlocks(),
			isLoading:
				isResolving( 'getUsers', [ SITE_EDITOR_AUTHORS_QUERY ] ) ||
				isResolving(
					'__experimentalGetCurrentThemeGlobalStylesRevisions'
				),
		};
	}, [] );

	const [ globalStylesRevision, setGlobalStylesRevision ] = useState( {} );
	const [ currentRevisionId, setCurrentRevisionId ] = useState(
		isDirty ? 'unsaved' : userRevisions[ 0 ]?.id
	);
	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	useEffect( () => {
		if ( editorCanvasContainerView !== 'global-styles-revisions' ) {
			goBack();
			setEditorCanvasContainerView( editorCanvasContainerView );
		}
	}, [ editorCanvasContainerView ] );

	const modifiedUserRevisions = useMemo( () => {
		if ( isLoading ) {
			return userRevisions;
		}
		/*
		 * Adds a flag to the first revision, which is the latest.
		 * Also adds author information to the revision.
		 * Then, if there are unsaved changes in the editor, create a
		 * new "revision" item that represents the unsaved changes.
		 */
		const _modified = userRevisions.map( ( revision, index, _array ) => {
			if ( 0 === index && _array[ index ]?.id !== 'unsaved' ) {
				revision.isLatest = true;
			}

			return {
				...revision,
				author: {
					...authors.find(
						( author ) => author.id === revision.author
					),
				},
			};
		} );

		if ( isDirty && ! isEmpty( userConfig ) && !! currentUser ) {
			const unsavedRevision = {
				id: 'unsaved',
				styles: userConfig?.styles,
				settings: userConfig?.settings,
				author: {
					name: currentUser?.name,
					avatar_urls: currentUser?.avatar_urls,
				},
				modified: new Date(),
			};

			return [ unsavedRevision ].concat( _modified );
		}
		return _modified;
	}, [ isDirty, isLoading ] );

	const restoreRevision = useCallback(
		( revision ) => {
			setUserConfig( () => ( {
				styles: revision?.styles,
				settings: revision?.settings,
			} ) );
			setIsLoadingRevisionWithUnsavedChanges( false );
			onCloseRevisions();
		},
		[ userConfig ]
	);

	const onCloseRevisions = () => {
		goBack();
	};

	const selectRevision = ( revision ) => {
		setGlobalStylesRevision( {
			styles: revision?.styles,
			settings: revision?.settings,
			id: revision?.id,
		} );
		setCurrentRevisionId( revision?.id );
	};

	const isLoadButtonEnabled =
		!! globalStylesRevision?.id &&
		! isGlobalStyleConfigEqual( globalStylesRevision, userConfig );

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={ __(
					'Revisions are added to the timeline when style changes are saved.'
				) }
			/>
			{ isLoading && (
				<Spinner className="edit-site-global-styles-screen-revisions__loading" />
			) }
			{ ! isLoading && (
				<Revisions
					blocks={ blocks }
					userConfig={ globalStylesRevision }
					onClose={ onCloseRevisions }
				/>
			) }
			<div className="edit-site-global-styles-screen-revisions">
				<RevisionsButtons
					onChange={ selectRevision }
					currentRevisionId={ currentRevisionId }
					userRevisions={ modifiedUserRevisions }
				/>
				{ isLoadButtonEnabled && (
					<SidebarFixedBottom>
						<Button
							variant="primary"
							className="edit-site-global-styles-screen-revisions__button"
							aria-label={ __( 'Load revision' ) }
							disabled={
								! globalStylesRevision?.id ||
								globalStylesRevision?.id === 'unsaved'
							}
							onClick={ () => {
								if ( isDirty ) {
									setIsLoadingRevisionWithUnsavedChanges(
										true
									);
								} else {
									restoreRevision( globalStylesRevision );
								}
							} }
						>
							{ __( 'Load revision' ) }
						</Button>
					</SidebarFixedBottom>
				) }
			</div>
			{ isLoadingRevisionWithUnsavedChanges && (
				<RestoreGlobalStylesRevisionModal
					onClose={ () =>
						setIsLoadingRevisionWithUnsavedChanges( false )
					}
					onSubmit={ () => restoreRevision( globalStylesRevision ) }
				/>
			) }
		</>
	);
}

export default ScreenRevisions;
