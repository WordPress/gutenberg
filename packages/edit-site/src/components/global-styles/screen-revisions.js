/**
 * External dependencies
 */
import { set } from 'lodash';
import classnames from 'classnames';

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

function cloneDeep( object ) {
	return ! object ? {} : JSON.parse( JSON.stringify( object ) );
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
	const [ currentRevision, setCurrentRevision ] = useState(
		userRevisions?.[ 0 ].id
	);
	const restoreRevision = useCallback(
		( revision ) => {
			const newUserConfig = cloneDeep( userConfig );
			set( newUserConfig, [ 'styles' ], revision?.styles );
			setUserConfig( () => newUserConfig );
			setCurrentRevision( revision?.id );
		},
		[ userConfig ]
	);

	const hasRevisions = userRevisions.length > 0;

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
					{ hasRevisions
						? userRevisions.map( ( revision ) => (
								<Button
									className={ classnames(
										'edit-site-global-styles-screen-revisions__revision-item',
										{
											'is-current':
												currentRevision === revision.id,
										}
									) }
									variant={
										currentRevision === revision.id
											? 'tertiary'
											: 'secondary'
									}
									isPressed={
										currentRevision === revision.id
									}
									disabled={ currentRevision === revision.id }
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
						  ) )
						: __( 'There are currently no revisions.' ) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenRevisions;
