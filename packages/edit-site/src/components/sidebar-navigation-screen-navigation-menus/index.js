/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useHistory } from '../routes';
import NavigationMenuContent from './navigation-menu-content';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

const noop = () => {};

function SidebarNavigationScreenWrapper( { children, actions } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Pages' ) }
			actions={ actions }
			description={ __( 'Browse your site and edit pages.' ) }
			content={ children }
		/>
	);
}

export default function SidebarNavigationScreenNavigationMenus() {
	const history = useHistory();
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		return {
			storedSettings: getSettings( false ),
		};
	}, [] );

	const blocks = [ createBlock( 'core/page-list' ) ];

	const onSelect = useCallback(
		( selectedBlock ) => {
			const { attributes, name } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.push( {
					postType: attributes.type,
					postId: attributes.id,
				} );
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.push( {
					postType: 'page',
					postId: attributes.id,
				} );
			}
		},
		[ history ]
	);

	return (
		<BlockEditorProvider
			settings={ storedSettings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<SidebarNavigationScreenWrapper>
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
					<NavigationMenuContent
						rootClientId={ blocks[ 0 ].clientId }
						onSelect={ onSelect }
					/>
				</div>
			</SidebarNavigationScreenWrapper>
		</BlockEditorProvider>
	);
}
