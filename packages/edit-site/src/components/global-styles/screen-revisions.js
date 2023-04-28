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
import { getDate, dateI18n } from '@wordpress/date';

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

function getRevisionLabel( revision, isLatest, isUnsaved ) {
	if ( isUnsaved ) {
		return sprintf(
			/* translators: %(name)s author display name */
			__( 'Unsaved changes by %(name)s' ),
			{
				name: revision?.authorDisplayName,
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
					name: revision?.authorDisplayName,
					date: formattedDate,
				}
		  )
		: sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Revision from %(date)s by %(name)s ' ),
				{
					name: revision?.authorDisplayName,
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
				const {
					id,
					dateHumanTimeDiff,
					authorAvatarUrl,
					authorDisplayName,
					isLatest,
				} = revision;
				const isUnsaved = 'unsaved' === id;
				/*
				 * If the currentId hasn't been selected yet, the first revision is
				 * the current one so long as the API returns revisions in descending order.
				 */
				const isActive = !! currentRevisionId
					? id === currentRevisionId
					: isLatest;

				return (
					<li
						className="edit-site-global-styles-screen-revisions__revision-item"
						key={ `user-styles-revision-${ id }` }
					>
						<Button
							className={ classnames(
								'edit-site-global-styles-screen-revisions__revision-button',
								{
									'is-current': isActive,
								}
							) }
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
									<span>
										{ isLatest
											? __( 'Currently-saved revision' )
											: __( 'Styles revision' ) }
									</span>
								) }
								<span className="edit-site-global-styles-screen-revisions__date">
									{ dateHumanTimeDiff }
								</span>
								<span className="edit-site-global-styles-screen-revisions__avatar">
									<img
										alt={ authorDisplayName }
										src={ authorAvatarUrl }
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
		blocks,
		currentUser,
		userRevisions,
		isDirty,
		editorCanvasContainerView,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetDirtyEntityRecords,
			isSavingEntityRecord,
			getCurrentUser,
		} = select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const _currentUser = getCurrentUser();
		const _isDirty = dirtyEntityRecords.length > 0;
		const _userRevisions =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesRevisions() || [];

		return {
			currentUser: _currentUser,
			isDirty: _isDirty,
			isSaving: dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			userRevisions: _userRevisions,
			editorCanvasContainerView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			blocks: select( blockEditorStore ).getBlocks(),
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
		if ( ! userRevisions.length ) {
			return userRevisions;
		}
		/*
		 * Adds a flag to the first revision, which is the latest.
		 * Then, if there are unsaved changes in the editor, create a
		 * new "revision" item that represents the unsaved changes.
		 */
		const _modified = userRevisions.map( ( revision, index, _array ) => {
			if ( 0 === index && _array[ index ]?.id !== 'unsaved' ) {
				revision.isLatest = true;
			}
			return revision;
		} );

		if ( isDirty && ! isEmpty( userConfig ) && !! currentUser ) {
			const unsavedRevision = {
				id: 'unsaved',
				styles: userConfig?.styles,
				settings: userConfig?.settings,
				authorDisplayName: currentUser?.name,
				authorAvatarUrl: currentUser?.avatar_urls?.[ '24' ],
				dateHumanTimeDiff: __( 'Just now' ),
			};
			return [ unsavedRevision ].concat( _modified );
		}
		return _modified;
	}, [ userRevisions.length, isDirty ] );

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
							aria-label={ __(
								'Restore and save selected revision'
							) }
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
			<Revisions
				blocks={ blocks }
				userConfig={ globalStylesRevision }
				onClose={ onCloseRevisions }
			/>
		</>
	);
}

export default ScreenRevisions;
