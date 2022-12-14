/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PluginSidebarEditPost from '../plugin-sidebar';
import { Icon, Button } from '@wordpress/components';
import { lock, unlock } from '@wordpress/icons';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const SettingsSidebar = () => {
	const activeSessions = [
		{
			src: 'http://0.gravatar.com/avatar/fe38d164bce79d754ab3fa1a1388d37a',
			name: 'Ella',
			active: true,
		},
		{
			// Just adding a dummy image.
			src: 'http://0.gravatar.com/avatar/a',
			name: 'Nik',
		},
	];

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
			{ activeSessions.map( ( { src, name, active } ) => (
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
										backgroundColor: active
											? 'green'
											: 'gray',
										display: 'inline-block',
									} }
								/>
							</strong>
						</p>
						<div style={ { display: 'flex' } }>
							<Icon icon={ active ? unlock : lock } />
							{ active && (
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
