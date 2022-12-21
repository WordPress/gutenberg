/**
 * External dependencies
 */
import { set } from 'lodash';
import classnames from 'classnames';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { GlobalStylesContext } from './context';

// Taken from packages/edit-site/src/hooks/push-changes-to-global-styles/index.js.
// TODO abstract
function cloneDeep( object ) {
	return ! object ? {} : JSON.parse( JSON.stringify( object ) );
}

// Taken from packages/edit-site/src/components/global-styles/screen-style-variations.js.
// TODO abstract
function compareVariations( a, b ) {
	return (
		fastDeepEqual( a.styles, b.styles ) &&
		fastDeepEqual( a.settings, b.settings )
	);
}

function ScreenRevisions() {
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { userRevisions } = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		const _globalStylesId =
			select( coreStore ).__experimentalGetCurrentGlobalStylesId();

		// Maybe we can return the whole object from __experimentalGetCurrentGlobalStylesId
		// and rename it to __experimentalGetCurrentGlobalStyles,
		// otherwise we're grabbing this twice.
		const record = _globalStylesId
			? getEditedEntityRecord( 'root', 'globalStyles', _globalStylesId )
			: undefined;

		return {
			userRevisions: record?.revisions || [],
		};
	}, [] );

	const hasRevisions = userRevisions.length > 0;
	const [ currentRevisionId, setCurrentRevisionId ] = useState( () => {
		if ( ! hasRevisions ) {
			return 0;
		}
		let currentRevision = userRevisions[ 0 ];
		for ( let i = 0; i < userRevisions.length; i++ ) {
			if ( compareVariations( userConfig, userRevisions[ i ] ) ) {
				currentRevision = userRevisions[ i ];
				break;
			}
		}
		return currentRevision?.id;
	} );

	const restoreRevision = useCallback(
		( revision ) => {
			const newUserConfig = cloneDeep( userConfig );
			set( newUserConfig, [ 'styles' ], revision?.styles );
			set( newUserConfig, [ 'settings' ], revision?.settings );
			setUserConfig( () => newUserConfig );
			setCurrentRevisionId( revision?.id );
		},
		[ userConfig ]
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={ __(
					"Select a revision to preview it in the editor. Changes won't take effect until you've saved the template."
				) }
			/>
			<div className="edit-site-global-styles-screen-revisions">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'REVISIONS' ) }</Subtitle>
					{ hasRevisions ? (
						userRevisions.map( ( revision ) => {
							const isActive = revision?.id === currentRevisionId;
							return (
								<Button
									className={ classnames(
										'edit-site-global-styles-screen-revisions__revision-item',
										{
											'is-current': isActive,
										}
									) }
									variant={
										isActive ? 'tertiary' : 'secondary'
									}
									disabled={ isActive }
									key={ `user-styles-revision-${ revision.id }` }
									onClick={ () => {
										restoreRevision( revision );
									} }
								>
									<span className="edit-site-global-styles-screen-revisions__time-ago">
										{ revision.timeAgo }
									</span>
									<span className="edit-site-global-styles-screen-revisions__date">
										({ revision.dateShort })
									</span>
								</Button>
							);
						} )
					) : (
						<p>{ __( 'There are currently no revisions.' ) }</p>
					) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenRevisions;
