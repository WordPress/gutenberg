/**
 * External dependencies
 */
import classnames from 'classnames';

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
	check,
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

const SELECTOR_MINIMUM_REVISION_COUNT = 10;
const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function RevisionsSelect( { userRevisions, currentRevisionId, onChange } ) {
	const userRevisionsOptions = useMemo( () => {
		return ( userRevisions ?? [] ).map( ( revision ) => {
			return {
				value: revision.id,
				label: revision.isLatest
					? __( 'Latest saved revision' )
					: decodeEntities( revision.title.rendered ),
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
			<ol className="edit-site-global-styles-screen-revisions__revisions-list">
				{ userRevisions.map( ( revision ) => {
					revision.is_latest = undefined;
					const isActive = revision?.id === currentRevisionId;
					const revisionTitle = decodeEntities(
						revision.title.rendered
					);

					return (
						<li key={ `user-styles-revision-${ revision.id }` }>
							<Button
								className={ classnames(
									'edit-site-global-styles-screen-revisions__revision-item',
									{
										'is-current': isActive,
									}
								) }
								variant={ isActive ? 'tertiary' : 'secondary' }
								disabled={ isActive }
								icon={ revision.isLatest ? check : null }
								onClick={ () => {
									onChange( revision );
								} }
								aria-label={
									revision.isLatest
										? __( 'Restore latest saved revision' )
										: sprintf(
												/* translators: %s: human-friendly revision creation date */
												__(
													'Restore revision from %s'
												),
												revisionTitle
										  )
								}
							>
								<span className="edit-site-global-styles-screen-revisions__title">
									{ revision.isLatest
										? __( 'Latest saved revision' )
										: revisionTitle }
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
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
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

	const RevisionsComponent =
		userRevisions.length >= SELECTOR_MINIMUM_REVISION_COUNT
			? RevisionsSelect
			: RevisionsButtons;

	const hasUnsavedChanges =
		canRestoreCachedConfig &&
		! isGlobalStyleConfigEqual(
			cachedUserConfig,
			userRevisions.find( ( revision ) => revision.isLatest === true )
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
					<Subtitle>{ __( 'REVISIONS' ) }</Subtitle>
					<RevisionsComponent
						onChange={ restoreRevision }
						currentRevisionId={ currentRevisionId }
						userRevisions={ userRevisions }
					/>
					<VStack spacing={ 1 }>
						<Button
							onClick={ () => {
								if ( hasUnsavedChanges ) {
									restoreRevision( cachedUserConfig );
								}
							} }
							className="edit-site-global-styles-screen-revisions__button"
							icon={ backupIcon }
							aria-disabled={ ! hasUnsavedChanges }
						>
							{ __( 'Restore unsaved changes' ) }
						</Button>
						<Button
							onClick={ canReset ? onReset : undefined }
							icon={ isRTL ? redoIcon : undoIcon }
							className="edit-site-global-styles-screen-revisions__button"
							aria-disabled={ ! canReset }
						>
							{ __( 'Reset styles to theme default' ) }
						</Button>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

export default ScreenRevisions;
