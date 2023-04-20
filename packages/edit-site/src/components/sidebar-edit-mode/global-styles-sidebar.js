/**
 * WordPress dependencies
 */
import { FlexItem, FlexBlock, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../private-apis';

export default function GlobalStylesSidebar() {
	const { editorMode, editorRole } = useSelect( ( select ) => {
		return {
			editorMode: select( editSiteStore ).getEditorMode(),
			editorRole: unlock( select( editSiteStore ) ).getEditorRole(),
		};
	}, [] );
	const { setEditorRole } = unlock( useDispatch( editSiteStore ) );
	useEffect( () => {
		if ( editorMode !== 'visual' ) {
			setEditorRole( 'init' );
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
				<Flex className="edit-site-global-styles-sidebar__header">
					<FlexBlock style={ { minWidth: 'min-content' } }>
						<strong>{ __( 'Styles' ) }</strong>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ seen }
							label={ __( 'Style Book' ) }
							isPressed={ editorRole === 'style-book' }
							disabled={ editorMode !== 'visual' }
							onClick={ () => {
								setEditorRole(
									editorRole !== 'style-book'
										? 'style-book'
										: 'init'
								);
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
				onCloseStyleBook={ () => setEditorRole( 'init' ) }
			/>
		</DefaultSidebar>
	);
}
