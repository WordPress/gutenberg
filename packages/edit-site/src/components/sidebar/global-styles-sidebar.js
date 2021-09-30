/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useGlobalStylesReset } from '../editor/global-styles-provider';
import DefaultSidebar from './default-sidebar';
import GlobalStyles from '../global-styles';

export default function GlobalStylesSidebar() {
	const [ canRestart, onReset ] = useGlobalStylesReset();

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close global styles sidebar' ) }
			header={
				<>
					<strong>{ __( 'Styles' ) }</strong>
					<span className="edit-site-global-styles-sidebar__beta">
						{ __( 'Beta' ) }
					</span>
					<Button
						className="edit-site-global-styles-sidebar__reset-button"
						isSmall
						variant="tertiary"
						disabled={ ! canRestart }
						onClick={ onReset }
					>
						{ __( 'Reset to defaults' ) }
					</Button>
				</>
			}
		>
			<GlobalStyles />
		</DefaultSidebar>
	);
}
