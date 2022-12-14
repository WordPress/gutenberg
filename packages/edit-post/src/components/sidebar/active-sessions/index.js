/**
 * WordPress dependencies
 */
import { Platform, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, Button } from '@wordpress/components';
import { lock, unlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebarEditPost from '../plugin-sidebar';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const SettingsSidebar = () => {
	const activeSessions = [
		{
			src: 'http://0.gravatar.com/avatar/fe38d164bce79d754ab3fa1a1388d37a',
			name: 'Ella',
			isLocked: false,
		},
		{
			// Just adding a dummy image.
			src: 'http://0.gravatar.com/avatar/a',
			name: 'Nik',
			isLocked: true,
		},
	];

	useEffect( () => {
		// - We have to send a request to the server to add the current user to
		//   the list of active sessions. Response should be a list of all
		//   active sessions.
		// - When closing the page we have to send a request to the server to
		//   remove the current user from the list of active sessions.
		// - We need to poll the server to get the list of active sessions
		//   regularly. We could use the heartbeat API for this for now.
		// - When taking over the lock we have to send a request to the server
		//   to update the post lock. We need to make sure the latest changes
		//   are saved somehow.
		// Details on these events on the Heartbeat API docs
		// https://developer.wordpress.org/plugins/javascript/heartbeat-api/
		// addAction( 'heartbeat.send', hookName, sendPostLock );
		// addAction( 'heartbeat.tick', hookName, receivePostLock );
		// window.addEventListener( 'beforeunload', releasePostLock );
		// return () => {
		// 	removeAction( 'heartbeat.send', hookName );
		// 	removeAction( 'heartbeat.tick', hookName );
		// 	window.removeEventListener( 'beforeunload', releasePostLock );
		// };
	}, [] );

	return (
		<PluginSidebarEditPost
			identifier="edit-post/active-sessions"
			header={ <strong>{ __( 'Active sessions' ) }</strong> }
			closeLabel={ __( 'Hide active sessions' ) }
			headerClassName="edit-post-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Active sessions' ) }
			icon={
				<>
					{ activeSessions.map( ( { src } ) => (
						<div
							key={ src }
							style={ { width: '14px', height: '28px' } }
						>
							<img
								alt=""
								src={ `${ src }?s=28&d=mm&r=g` }
								srcSet={ `${ src }?s=56&d=mm&r=g 2x` }
								height="28"
								width="28"
								style={ {
									borderRadius: '50%',
									display: 'inline-block',
									maxWidth: '200%',
								} }
							/>
						</div>
					) ) }
					<div style={ { width: '14px', height: '28px' } } />
				</>
			}
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			{ activeSessions.map( ( { src, name, isLocked } ) => (
				<div
					key={ src }
					style={ {
						padding: '14px',
						borderBottom: '1px #e0e0e0 solid',
						display: 'flex',
						gap: '14px',
					} }
				>
					<img
						alt=""
						src={ `${ src }?s=56&d=mm&r=g` }
						srcSet={ `${ src }?s=112&d=mm&r=g 2x` }
						height="56"
						width="56"
						style={ {
							display: 'inline-block',
						} }
					/>
					<div>
						<p style={ { marginBottom: '7px' } }>
							<strong>
								{ name }{ ' ' }
								<span
									style={ {
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										backgroundColor: isLocked
											? 'gray'
											: 'green',
										display: 'inline-block',
									} }
								/>
							</strong>
						</p>
						<div style={ { display: 'flex' } }>
							<Icon icon={ isLocked ? lock : unlock } />
							{ ! isLocked && (
								<Button variant="secondary" isSmall>
									{ __( 'Take over' ) }
								</Button>
							) }
						</div>
					</div>
				</div>
			) ) }
		</PluginSidebarEditPost>
	);
};

export default SettingsSidebar;
