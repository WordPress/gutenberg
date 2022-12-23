/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { GlobalStylesContext } from './context';
import { decodeEntities } from '@wordpress/html-entities';
import { isGlobalStyleConfigEqual } from './utils';

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
	return (
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
							onClick={ () => {
								onChange( revision );
							} }
						>
							<span className="edit-site-global-styles-screen-revisions__title">
								{ revision.title.rendered }
							</span>
						</Button>
					</li>
				);
			} ) }
		</ol>
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
	const hasRevisions = userRevisions.length > 0;

	useEffect( () => {
		if ( ! hasRevisions ) {
			return;
		}
		let currentRevision = userRevisions[ 0 ];
		for ( let i = 0; i < userRevisions.length; i++ ) {
			if ( isGlobalStyleConfigEqual( userConfig, userRevisions[ i ] ) ) {
				currentRevision = userRevisions[ i ];
				break;
			}
		}
		setCurrentRevisionId( currentRevision?.id );
	}, [ userRevisions, hasRevisions ] );

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
		userRevisions.length >= 10 ? RevisionsSelect : RevisionsButtons;

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={ __(
					"Select one of your styles revisions to preview it in the editor. Changes won't take effect until you've saved the template."
				) }
			/>
			<div className="edit-site-global-styles-screen-revisions">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'REVISIONS' ) }</Subtitle>
					{ hasRevisions ? (
						<RevisionsComponent
							onChange={ restoreRevision }
							currentRevisionId={ currentRevisionId }
							userRevisions={ userRevisions }
						/>
					) : (
						<p>{ __( 'There are currently no revisions.' ) }</p>
					) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenRevisions;
