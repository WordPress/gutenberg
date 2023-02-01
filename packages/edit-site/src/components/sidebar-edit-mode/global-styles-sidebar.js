/**
 * WordPress dependencies
 */
import { FlexItem, FlexBlock, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';

export default function GlobalStylesSidebar() {
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
						<GlobalStylesMenuSlot />
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
