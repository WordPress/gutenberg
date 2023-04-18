/**
 * External dependencies
 */
import classnames from 'classnames';
import { set } from 'lodash';
/**
 * WordPress dependencies
 */
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	Button,
	SelectControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	useContext,
	useCallback,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';
import {
	undo as undoIcon,
	redo as redoIcon,
	backup as backupIcon,
} from '@wordpress/icons';
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

function ScreenRevisions() {
	const { useGlobalStylesReset, GlobalStylesContext } = unlock( blockEditorPrivateApis );
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { userRevisions } = useSelect(
		( select ) => ( {
			userRevisions:
				select(
					coreStore
				).__experimentalGetCurrentThemeGlobalStylesRevisions() || [],
		} ),
		[]
	);
	const [ globalStylesRevision, setGlobalStylesRevision ] = useState( {} );
	const [ currentRevisionId, setCurrentRevisionId ] = useState();
	const [ cachedUserConfig ] = useState( userConfig );
	const [ canRestoreCachedConfig, setCanRestoreCachedConfig ] =
		useState( false );

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
			// setUserConfig( ( currentConfig ) => {
			// 	// Deep clone `currentConfig` to avoid mutating it later.
			// 	const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			// 	set( newUserConfig, contextualPath, newValue );
			// 	return  {
			// 		styles: revision?.styles,
			// 			settings: revision?.settings,
			// 	};
			//
			// } );
			setUserConfig( () => ( {
				styles: revision?.styles,
				settings: revision?.settings,
			} ) );
			setCurrentRevisionId( revision?.id );
			setCanRestoreCachedConfig(
				! isGlobalStyleConfigEqual( cachedUserConfig, revision )
			);
		},
		[ userConfig, cachedUserConfig ]
	);

	const selectRevision = ( revision ) => {
		console.log( 'selectRevision', revision?.styles );
		setGlobalStylesRevision( revision?.styles )
	};

	const RevisionsComponent =
		userRevisions.length >= SELECTOR_MINIMUM_REVISION_COUNT
			? RevisionsSelect
			: RevisionsButtons;

	const hasUnsavedChanges =
		canRestoreCachedConfig &&
		! isGlobalStyleConfigEqual(
			cachedUserConfig,
			userRevisions.find( ( revision ) => revision.is_latest === true )
		);

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={ __(
					"Select one of your global styles revisions to preview it in the editor. Changes won't take effect until you've saved the template."
				) }
			/>
			<div className="edit-site-global-styles-screen-revisions">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'Revisions' ) }</Subtitle>
					<RevisionsComponent
						onChange={ selectRevision }
						currentRevisionId={ currentRevisionId }
						userRevisions={ userRevisions }
					/>
					<VStack spacing={ 1 }>
						{/*<Button*/}
						{/*	onClick={ () => {*/}
						{/*		if ( hasUnsavedChanges ) {*/}
						{/*			selectRevision( cachedUserConfig );*/}
						{/*		}*/}
						{/*	} }*/}
						{/*	className="edit-site-global-styles-screen-revisions__button"*/}
						{/*	icon={ backupIcon }*/}
						{/*	aria-disabled={ ! hasUnsavedChanges }*/}
						{/*>*/}
						{/*	{ __( 'Restore unsaved changes' ) }*/}
						{/*</Button>*/}
						{/*<Button*/}
						{/*	onClick={ canReset ? onReset : undefined }*/}
						{/*	icon={ isRTL ? redoIcon : undoIcon }*/}
						{/*	className="edit-site-global-styles-screen-revisions__button"*/}
						{/*	aria-disabled={ ! canReset }*/}
						{/*>*/}
						{/*	{ __( 'Reset styles to theme default' ) }*/}
						{/*</Button>*/}
						<Button
							variant="primary"
							onClick={ () => restoreRevision( globalStylesRevision ) }
						>
							{ __( 'Restore and save revision' ) }

						</Button>
					</VStack>
				</VStack>
			</div>
			<Revisions styles={ globalStylesRevision } />
		</>
	);
}

export default ScreenRevisions;
