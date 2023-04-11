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
	check,
	redo as redoIcon,
	reset as resetIcon,
	undo as undoIcon,
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

export const MINIMUM_REVISION_COUNT = 1;
const SELECTOR_MINIMUM_REVISION_COUNT = 10;
const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function RevisionsSelect( { userRevisions, currentRevisionId, onChange } ) {
	const userRevisionsOptions = useMemo( () => {
		return ( userRevisions ?? [] ).map( ( revision ) => {
			return {
				value: revision.id,
				label: decodeEntities( revision.title.rendered ),
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
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { hasUndo } = useSelect(
		( select ) => ( {
			hasUndo: select( coreStore ).hasUndo(),
		} ),
		[]
	);
	const { undo } = useDispatch( coreStore );

	return (
		<>
			<ol className="edit-site-global-styles-screen-revisions__revisions-list">
				{ userRevisions.map( ( revision ) => {
					const isActive = revision?.id === currentRevisionId;
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
								icon={ isActive ? check : null }
								onClick={ () => {
									onChange( revision );
								} }
								aria-label={ sprintf(
									/* translators: %s: human-friendly revision creation date */
									__( 'Restore revision from %s' ),
									revision.title.rendered
								) }
							>
								<span className="edit-site-global-styles-screen-revisions__title">
									{ revision.title.rendered }
								</span>
							</Button>
						</li>
					);
				} ) }
			</ol>
			<div className="edit-site-global-styles-screen-revisions__buttons">
				<Button
					onClick={ hasUndo ? undo : undefined }
					icon={ ! isRTL() ? redoIcon : undoIcon }
					className="edit-site-global-styles-screen-revisions__undo"
					label={ __( 'Undo last change' ) }
					aria-disabled={ ! hasUndo }
				/>
				<Button
					onClick={ canReset ? onReset : undefined }
					icon={ resetIcon }
					className="edit-site-global-styles-screen-revisions__reset"
					label={ __( 'Reset styles to defaults' ) }
					aria-disabled={ ! canReset }
				/>
			</div>
		</>
	);
}

function ScreenRevisions() {
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
	const hasRevisions = userRevisions.length >= MINIMUM_REVISION_COUNT;

	useEffect( () => {
		if ( ! hasRevisions ) {
			return;
		}
		let currentRevision = userRevisions[ 0 ];
		for ( let i = 0; i < userRevisions.length; i++ ) {
			if ( isGlobalStyleConfigEqual( userConfig, userRevisions[ i ] ) ) {
				// @TODO: Should we remove revisions from the list that match exactly the default global styles?
				currentRevision = userRevisions[ i ];
				break;
			}
		}
		setCurrentRevisionId( currentRevision?.id );
	}, [ userRevisions, hasRevisions, userConfig ] );

	const restoreRevision = useCallback(
		( revision ) => {
			setUserConfig( () => ( {
				styles: revision?.styles,
				settings: revision?.settings,
			} ) );
			setCurrentRevisionId( revision?.id );
		},
		[ userConfig ]
	);

	const RevisionsComponent =
		userRevisions.length >= SELECTOR_MINIMUM_REVISION_COUNT
			? RevisionsSelect
			: RevisionsButtons;

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
					{ hasRevisions ? (
						<>
							<RevisionsComponent
								onChange={ restoreRevision }
								currentRevisionId={ currentRevisionId }
								userRevisions={ userRevisions }
							/>
						</>
					) : (
						<p>{ __( 'There are currently no revisions.' ) }</p>
					) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenRevisions;
