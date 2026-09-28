import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import { useGlobalStyles } from './hooks';

/**
 * Action menu with Reset, Welcome Guide, and Additional CSS.
 *
 * @param {Object}   props                  Component props.
 * @param {boolean}  props.hideWelcomeGuide Whether to hide the Welcome Guide option.
 * @param {Function} props.onChangePath     Callback for navigation to different paths (e.g., '/css').
 * @return {React.JSX.Element} The Global Styles Action Menu component.
 */
export function GlobalStylesActionMenu( {
	hideWelcomeGuide = false,
	onChangePath,
} ) {
	const { user, setUser } = useGlobalStyles();

	// Check if there are user customizations that can be reset
	const canReset =
		!! user &&
		( Object.keys( user?.styles ?? {} ).length > 0 ||
			Object.keys( user?.settings ?? {} ).length > 0 );

	// Reset function to clear all user customizations
	const onReset = () => {
		setUser( { styles: {}, settings: {} } );
	};
	const { toggle } = useDispatch( preferencesStore );
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
		};
	}, [] );
	const loadCustomCSS = () => {
		onChangePath( '/css' );
	};
	const hasPrimaryActions = canEditCSS || ! hideWelcomeGuide;

	return (
		<Menu.Root modal={ false }>
			<Menu.Trigger
				render={
					<Button
						icon={ moreVertical }
						label={ __( 'More' ) }
						size="compact"
					/>
				}
			/>
			<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
				{ hasPrimaryActions && (
					<Menu.Group>
						{ canEditCSS && (
							<Menu.Item onClick={ loadCustomCSS }>
								<Menu.ItemLabel>
									{ __( 'Additional CSS' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						) }
						{ ! hideWelcomeGuide && (
							<Menu.Item
								onClick={ () => {
									toggle(
										'core/edit-site',
										'welcomeGuideStyles'
									);
								} }
							>
								<Menu.ItemLabel>
									{ __( 'Welcome Guide' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						) }
					</Menu.Group>
				) }
				{ hasPrimaryActions && <Menu.Separator /> }
				<Menu.Group>
					<Menu.Item onClick={ onReset } disabled={ ! canReset }>
						<Menu.ItemLabel>
							{ __( 'Reset styles' ) }
						</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
