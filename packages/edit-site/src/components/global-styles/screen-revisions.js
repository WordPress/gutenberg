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
	__experimentalHStack as HStack,
	Button,
	SelectControl,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	useContext,
	useCallback,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { decodeEntities } from '@wordpress/html-entities';
import { isGlobalStyleConfigEqual } from './utils';
import { unlock } from '../../private-apis';
import Revisions from '../revisions';
import { store as editSiteStore } from '../../store';

const SELECTOR_MINIMUM_REVISION_COUNT = 10;
const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function RevisionsSelect( { userRevisions, currentRevisionId, onChange } ) {
	const userRevisionsOptions = useMemo( () => {
		return ( userRevisions ?? [] ).map( ( revision ) => {
			const { id, date, author, is_latest: isLatest } = revision;
			const revisionTitle = decodeEntities( date?.rendered );
			return {
				value: id,
				label: isLatest
					? sprintf(
							/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
							__( 'Current revision by %(name)s from %(date)s)' ),
							{
								name: author?.display_name,
								date: revisionTitle,
							}
					  )
					: sprintf(
							/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
							__( 'Revision by %(name)s from %(date)s' ),
							{
								name: author?.display_name,
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
				{ userRevisions.map( ( revision ) => {
					const { id, date, author, is_latest: isLatest } = revision;
					const isActive = id === currentRevisionId;
					const revisionTitle = decodeEntities( date?.rendered );

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
													name: author?.display_name,
													date: revisionTitle,
												}
										  )
										: sprintf(
												/* translators: %(name)s author display name, %(date)s: human-friendly revision creation date */
												__(
													'Revision by %(name)s from %(date)s'
												),
												{
													name: author?.display_name,
													date: revisionTitle,
												}
										  )
								}
							>
								<span className="edit-site-global-styles-screen-revisions__description">
									<span className="edit-site-global-styles-screen-revisions__avatar">
										<img
											alt={ author?.display_name }
											src={ author?.avatar_url }
										/>
									</span>
									<span>
										{ isLatest
											? sprintf(
													/* translators: %s: author display name */
													__(
														'Current revision by %s'
													),
													author?.display_name
											  )
											: sprintf(
													/* translators: %s: author display name */
													__( 'Revision by %s' ),
													author?.display_name
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

function ScreenRevisions( { onClose } ) {
	const { goBack } = useNavigator();

	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { userRevisions, isDirty } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			userRevisions:
				select(
					coreStore
				).__experimentalGetCurrentThemeGlobalStylesRevisions() || [],
		};
	}, [] );
	const [ globalStylesRevision, setGlobalStylesRevision ] = useState( {} );
	const [ currentRevisionId, setCurrentRevisionId ] = useState();
	const [ shouldSaveUnsavedChanges, setShouldSaveUnsavedChanges ] =
		useState( true );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );
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

	const restoreRevision = useCallback(
		( revision ) => {
			setUserConfig( () => ( {
				styles: revision?.styles,
				settings: revision?.settings,
			} ) );
			setIsSaveViewOpened( true );
		},
		[ userConfig ]
	);

	const onCloseRevisions = () => {
		goBack();
	};

	const selectRevision = ( revision ) => {
		setGlobalStylesRevision( revision );
		setCurrentRevisionId( revision?.id );
	};

	const RevisionsComponent =
		userRevisions.length >= SELECTOR_MINIMUM_REVISION_COUNT
			? RevisionsSelect
			: RevisionsButtons;

	const hasUnsavedContent = isDirty && shouldSaveUnsavedChanges;

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={
					hasUnsavedContent
						? __(
								"Select one of your global styles revisions to preview it in the editor. Changes won't take effect until you've saved the template."
						  )
						: __(
								'You have unsaved changes. Restoring a revision will discard this changes.'
						  )
				}
			/>
			<div className="edit-site-global-styles-screen-revisions">
				<VStack spacing={ 3 }>
					{ hasUnsavedContent ? (
						<>
							<Button
								variant="primary"
								className="edit-site-global-styles-screen-revisions__button"
								aria-label={ __(
									'Save my unsaved changes now'
								) }
								onClick={ () => setIsSaveViewOpened( true ) }
							>
								{ __( 'Save my unsaved changes' ) }
							</Button>
							<Button
								variant="primary"
								className="edit-site-global-styles-screen-revisions__button"
								aria-label={ __( "Don't save" ) }
								onClick={ () =>
									setShouldSaveUnsavedChanges( false )
								}
							>
								{ __( "Don't save" ) }
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
								onClick={ () =>
									restoreRevision( globalStylesRevision )
								}
							>
								{ __( 'Restore and save selected revision' ) }
							</Button>
						</>
					) }
				</VStack>
			</div>
			<Revisions revision={ globalStylesRevision } onClose={ onCloseRevisions } />
		</>
	);
}

export default ScreenRevisions;
