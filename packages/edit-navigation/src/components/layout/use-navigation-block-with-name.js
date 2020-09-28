/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { BlockControls } from '@wordpress/block-editor';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	__experimentalEditInPlaceControl as EditInPlaceControl,
	ToolbarGroup,
} from '@wordpress/components';

export default function useNavigationBlockWithName( menuId ) {
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );

	const { saveMenu } = useDispatch( 'core' );

	useEffect( () => {
		if ( menu ) {
			const withMenuName = createHigherOrderComponent(
				( BlockEdit ) => ( props ) => {
					if ( props.name !== 'core/navigation' ) {
						return <BlockEdit { ...props } />;
					}
					return (
						<>
							<BlockEdit { ...props } />
							<BlockControls>
								<ToolbarGroup>
									<EditInPlaceControl
										label={ menu?.name ?? '(untitled menu)' }
										onUpdate={ ( value ) => {
											saveMenu( {
												...menu,
												name: value || '(untitled menu)',
											} );
										} }
									/>
								</ToolbarGroup>
							</BlockControls>
						</>
					);
				},
				'withMenuName'
			);
			addFilter(
				'editor.BlockEdit',
				'core/edit-navigation/with-menu-name',
				withMenuName
			);
			return () => removeFilter( 'editor.BlockEdit', 'core/edit-navigation/with-menu-name',  withMenuName );
		}
	}, [ menu ] );


}
