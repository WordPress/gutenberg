/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { check, moreHorizontal } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const ShapesDropdownMenu = ( { shapes, addShape, removeShape } ) => (
	<DropdownMenu icon={ moreHorizontal } label={ __( 'Shapes' ) }>
		{ ( { onClose } ) => (
			<>
				<MenuGroup label={ __( 'Shapes' ) }>
					{ shapes.map( ( shape, index ) => {
						const shapeLabel = sprintf(
							// translators: %d is the shape's index.
							__( 'Shape %d' ),
							index + 1
						);

						return (
							<MenuItem
								key={ `shape-menu-item-${ index }` }
								icon={ check }
								onClick={ () => {
									removeShape( index );
									onClose();
								} }
								role="menuitemcheckbox"
							>
								{ shapeLabel }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
				<MenuGroup>
					<MenuItem
						onClick={ () => {
							addShape();
							onClose();
						} }
					>
						{ __( 'Add shape' ) }
					</MenuItem>
				</MenuGroup>
			</>
		) }
	</DropdownMenu>
);

export default ShapesDropdownMenu;
