/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	Button,
	SelectControl,
	__experimentalUseNavigator as useNavigator,
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

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { decodeEntities } from '@wordpress/html-entities';
import { unlock } from '../../private-apis';
import Revisions from '../revisions';
import { store as editSiteStore } from '../../store';

const SELECTOR_MINIMUM_REVISION_COUNT = 10;
const { GlobalStylesContext, isGlobalStyleConfigEqual } = unlock(
	blockEditorPrivateApis
);

function RevisionsSelect( { userRevisions, currentRevisionId, onChange } ) {
	const userRevisionsOptions = useMemo( () => {
		return ( userRevisions ?? [] ).map( ( revision, index ) => {
			const { id, dateDisplay, authorDisplayName } = revision;
			const isLatest = 0 === index;
			const revisionTitle = decodeEntities( dateDisplay );
			return {
				value: id,
				label: isLatest
					? sprintf(
							/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
							__( 'Current revision by %(name)s from %(date)s)' ),
							{
								name: authorDisplayName,
								date: revisionTitle,
							}
					  )
					: sprintf(
							/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
							__( 'Revision by %(name)s from %(date)s' ),
							{
								name: authorDisplayName,
								date: revisionTitle,
							}
					  ),
			};
		} );
	}, [ userRevisions ] );
	const setCurrentRevisionId = ( value ) => {
		const revisionId = Number( value );
		onChange(
			userRevisions.find( ( revision ) => revision.id === revisionId )
		);
	};
	return (
		<SelectControl
			className="edit-site-global-styles-screen-revisions__selector"
			label={ __( 'Styles revisions' ) }
			options={ userRevisionsOptions }
			onChange={ setCurrentRevisionId }
			value={ currentRevisionId }
		/>
	);
}

function RevisionsButtons( { userRevisions, currentRevisionId, onChange } ) {
	return (
		<>
			<Subtitle>{ __( 'Styles revisions' ) }</Subtitle>

			<ol
				className="edit-site-global-styles-screen-revisions__revisions-list"
				aria-label={ __( 'Global styles revisions' ) }
				role="group"
			>
				{ userRevisions.map( ( revision, index ) => {
					const {
						id,
						dateDisplay,
						authorAvatarUrl,
						authorDisplayName,
					} = revision;
					const isLatest = 0 === index;
					const isActive = id === currentRevisionId;
					const revisionTitle = decodeEntities( dateDisplay );

					return (
						<li key={ `user-styles-revision-${ id }` }>
							<Button
								className={ classnames(
									'edit-site-global-styles-screen-revisions__revision-item',
									{
										'is-current': isActive,
									}
								) }
								disabled={ isActive }
								onClick={ () => {
									onChange( revision );
								} }
								aria-label={
									isLatest
										? sprintf(
												/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
												__(
													'Revision by %(name)s from %(date)s (current)'
												),
												{
													name: authorDisplayName,
													date: revisionTitle,
												}
										  )
										: sprintf(
												/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
												__(
													'Revision by %(name)s from %(date)s'
												),
												{
													name: authorDisplayName,
													date: revisionTitle,
												}
										  )
								}
							>
								<span className="edit-site-global-styles-screen-revisions__description">
									<span className="edit-site-global-styles-screen-revisions__avatar">
										<img
											alt={ authorDisplayName }
											src={ authorAvatarUrl }
										/>
									</span>
									<span>
										{ isLatest
											? sprintf(
													/* translators: %s: author display name */
													__(
														'Current revision by %s'
													),
													authorDisplayName
											  )
											: sprintf(
													/* translators: %s: author display name */
													__( 'Revision by %s' ),
													authorDisplayName
											  ) }
									</span>
									<span className="edit-site-global-styles-screen-revisions__date">
										{ revisionTitle }
									</span>
								</span>
							</Button>
						</li>
					);
				} ) }
			</ol>
		</>
	);
}

function ScreenRevisions() {
	const { goBack } = useNavigator();
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { blocks, userRevisions, isDirty, editorCanvasContainerView } =
		useSelect( ( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				isSavingEntityRecord,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();

			return {
				isDirty: dirtyEntityRecords.length > 0,
				isSaving: dirtyEntityRecords.some( ( record ) =>
					isSavingEntityRecord( record.kind, record.name, record.key )
				),
				userRevisions:
					select(
						coreStore
					).__experimentalGetCurrentThemeGlobalStylesRevisions() ||
					[],
				editorCanvasContainerView: unlock(
					select( editSiteStore )
				).getEditorCanvasContainerView(),
				blocks: select( blockEditorStore ).getBlocks(),
			};
		}, [] );

	const [ globalStylesRevision, setGlobalStylesRevision ] = useState( {} );
	const [ currentRevisionId, setCurrentRevisionId ] = useState();
	const [ isRestoringRevision, setIsRestoringRevision ] = useState( false );

	useEffect( () => {
		let currentRevision = null;
		for ( let i = 0; i < userRevisions.length; i++ ) {
			if ( isGlobalStyleConfigEqual( userConfig, userRevisions[ i ] ) ) {
				currentRevision = userRevisions[ i ];
				break;
			}
		}
		setCurrentRevisionId( currentRevision?.id );
	}, [ userRevisions, userConfig ] );

	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	useEffect( () => {
		if ( editorCanvasContainerView !== 'global-styles-revisions' ) {
			goBack();
			setEditorCanvasContainerView( editorCanvasContainerView );
		}
	}, [ editorCanvasContainerView ] );

	const restoreRevision = useCallback(
		( revision ) => {
			setUserConfig( () => ( {
				styles: revision?.styles,
				settings: revision?.settings,
			} ) );
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

	const RevisionsComponent =
		userRevisions.length >= SELECTOR_MINIMUM_REVISION_COUNT
			? RevisionsSelect
			: RevisionsButtons;

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={
					! isRestoringRevision
						? __(
								"Select one of your global styles revisions to preview it in the editor. Changes won't take effect until you've saved the template."
						  )
						: __(
								'You have unsaved changes in the editor. Restoring a revision will discard these changes. You can either return to the editor to save your unsaved changes, or overwrite them with the selected revision.'
						  )
				}
			/>
			<div className="edit-site-global-styles-screen-revisions">
				<VStack spacing={ 3 }>
					{ isRestoringRevision ? (
						<>
							<Button
								variant="primary"
								className="edit-site-global-styles-screen-revisions__button"
								aria-label={ __(
									'Save my changes in the editor'
								) }
								onClick={ () => {
									onCloseRevisions();
								} }
							>
								{ __( 'Save my changes in the editor' ) }
							</Button>
							<Button
								variant="primary"
								className="edit-site-global-styles-screen-revisions__button"
								aria-label={ __( 'Overwrite my changes' ) }
								onClick={ () => {
									restoreRevision( globalStylesRevision );
									setIsRestoringRevision( false );
								} }
							>
								{ __( 'Overwrite my changes' ) }
							</Button>
						</>
					) : (
						<>
							<RevisionsComponent
								onChange={ selectRevision }
								currentRevisionId={ currentRevisionId }
								userRevisions={ userRevisions }
							/>
							<Button
								variant="primary"
								className="edit-site-global-styles-screen-revisions__button"
								aria-label={ __(
									'Restore and save selected revision'
								) }
								disabled={ ! globalStylesRevision?.id }
								onClick={ () => {
									if ( isDirty ) {
										setIsRestoringRevision( true );
									} else {
										restoreRevision( globalStylesRevision );
									}
								} }
							>
								{ __( 'Use this revision' ) }
							</Button>
						</>
					) }
				</VStack>
			</div>
			<Revisions
				blocks={ blocks }
				userConfig={ globalStylesRevision }
				onClose={ onCloseRevisions }
			/>
		</>
	);
}

export default ScreenRevisions;
