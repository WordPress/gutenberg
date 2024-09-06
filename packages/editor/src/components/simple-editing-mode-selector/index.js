/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Dropdown,
	Button,
	MenuItemsChoice,
	NavigableMenu,
	SVG,
	Path,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

const selectIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
	>
		<Path d="M9.4 20.5L5.2 3.8l14.6 9-2 .3c-.2 0-.4.1-.7.1-.9.2-1.6.3-2.2.5-.8.3-1.4.5-1.8.8-.4.3-.8.8-1.3 1.5-.4.5-.8 1.2-1.2 2l-.3.6-.9 1.9zM7.6 7.1l2.4 9.3c.2-.4.5-.8.7-1.1.6-.8 1.1-1.4 1.6-1.8.5-.4 1.3-.8 2.2-1.1l1.2-.3-8.1-5z" />
	</SVG>
);

function SimpleEditingModeSelector( props, ref ) {
	const { postType, renderingMode } = useSelect(
		( select ) => ( {
			postType: select( editorStore ).getCurrentPostType(),
			renderingMode: select( editorStore ).getRenderingMode(),
		} ),
		[]
	);

	const { setRenderingMode } = useDispatch( editorStore );

	if ( postType !== TEMPLATE_POST_TYPE ) {
		return null;
	}

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
					{ ...props }
					ref={ ref }
					icon={ selectIcon }
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					/* translators: button label text should, if possible, be under 16 characters. */
					label={ __( 'Editing mode' ) }
				/>
			) }
			popoverProps={ { placement: 'bottom-start' } }
			renderContent={ () => (
				<NavigableMenu
					className="editor-simple-editing-mode-selector__menu"
					role="menu"
					aria-label={ __( 'Editing mode' ) }
				>
					<MenuItemsChoice
						value={
							renderingMode === 'template-locked'
								? 'simple'
								: 'advanced'
						}
						onSelect={ ( mode ) =>
							setRenderingMode(
								mode === 'simple'
									? 'template-locked'
									: 'post-only'
							)
						}
						choices={ [
							{
								value: 'advanced',
								label: __( 'Design' ),
								info: __(
									'Full control over layout and styling'
								),
							},
							{
								value: 'simple',
								label: __( 'Edit' ),
								info: __(
									'Focus on page structure and content'
								),
							},
						] }
					/>
				</NavigableMenu>
			) }
		/>
	);
}

export default forwardRef( SimpleEditingModeSelector );
