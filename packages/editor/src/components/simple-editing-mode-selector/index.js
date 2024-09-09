/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	SVG,
	Path,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { edit } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

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
		<DropdownMenuV2
			align="start"
			trigger={
				<Button
					{ ...props }
					ref={ ref }
					icon={
						renderingMode === 'template-locked' ? selectIcon : edit
					}
					label={ __( 'Editing mode' ) }
					size="small"
				/>
			}
		>
			<DropdownMenuV2.Group>
				<DropdownMenuV2.RadioItem
					name="editing-mode"
					value="simple"
					checked={ renderingMode === 'template-locked' }
					onChange={ () => setRenderingMode( 'template-locked' ) }
				>
					<DropdownMenuV2.ItemLabel>
						{ __( 'Edit' ) }
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						{ __( 'Focus on content.' ) }
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
				<DropdownMenuV2.RadioItem
					name="editing-mode"
					value="advanced"
					checked={ renderingMode !== 'template-locked' }
					onChange={ () => setRenderingMode( 'post-only' ) }
				>
					<DropdownMenuV2.ItemLabel>
						{ __( 'Design' ) }
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						{ __( 'Full control over layout and styling.' ) }
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
			</DropdownMenuV2.Group>
		</DropdownMenuV2>
	);
}

export default forwardRef( SimpleEditingModeSelector );
