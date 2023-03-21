/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	FlexItem,
	FlexBlock,
	Flex,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, moreVertical, seen } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useState, useEffect } from '@wordpress/element';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../experiments';

const { useGlobalStylesReset } = unlock( blockEditorExperiments );

export default function GlobalStylesSidebar() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { toggle } = useDispatch( preferencesStore );
	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState( false );
	const editorMode = useSelect(
		( select ) => select( editSiteStore ).getEditorMode(),
		[]
	);
	useEffect( () => {
		if ( editorMode !== 'visual' ) {
			setIsStyleBookOpened( false );
		}
	}, [ editorMode ] );
	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close Styles sidebar' ) }
			panelClassName="edit-site-global-styles-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Styles' ) }</strong>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ seen }
							label={
								isStyleBookOpened
									? __( 'Close Style Book' )
									: __( 'Open Style Book' )
							}
							isPressed={ isStyleBookOpened }
							disabled={ editorMode !== 'visual' }
							onClick={ () => {
								setIsStyleBookOpened( ! isStyleBookOpened );
							} }
						/>
					</FlexItem>
					<FlexItem>
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'More Styles actions' ) }
							controls={ [
								{
									title: __( 'Reset to defaults' ),
									onClick: onReset,
									isDisabled: ! canReset,
								},
								{
									title: __( 'Welcome Guide' ),
									onClick: () =>
										toggle(
											'core/edit-site',
											'welcomeGuideStyles'
										),
								},
							] }
						/>
					</FlexItem>
				</Flex>
			}
		>
			<GlobalStylesUI
				isStyleBookOpened={ isStyleBookOpened }
				onCloseStyleBook={ () => setIsStyleBookOpened( false ) }
			/>
		</DefaultSidebar>
	);
}
