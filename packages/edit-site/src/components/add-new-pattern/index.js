/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus, header, file } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import CreatePatternModal from '../create-pattern-modal';
import CreateTemplatePartModal from '../create-template-part-modal';
import { unlock } from '../../lock-unlock';
import SidebarButton from '../sidebar-button';

const { useHistory } = unlock( routerPrivateApis );

export default function AddNewPattern() {
	const history = useHistory();
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );

	function handleCreatePattern( { pattern, categoryId } ) {
		setShowPatternModal( false );

		history.push( {
			postId: pattern.id,
			postType: 'wp_block',
			categoryType: 'wp_block',
			categoryId,
			canvas: 'edit',
		} );
	}

	function handleCreateTemplatePart( templatePart ) {
		setShowTemplatePartModal( false );

		// Navigate to the created template part editor.
		history.push( {
			postId: templatePart.id,
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
	}

	function handleError() {
		setShowPatternModal( false );
		setShowTemplatePartModal( false );
	}

	return (
		<>
			<DropdownMenu
				controls={ [
					{
						icon: header,
						onClick: () => setShowTemplatePartModal( true ),
						title: 'Create a template part',
					},
					{
						icon: file,
						onClick: () => setShowPatternModal( true ),
						title: 'Create a pattern',
					},
				] }
				icon={
					<SidebarButton
						icon={ plus }
						label={ __( 'Create a pattern' ) }
					/>
				}
				label="Create a pattern."
			/>
			{ showPatternModal && (
				<CreatePatternModal
					closeModal={ () => setShowPatternModal( false ) }
					onCreate={ handleCreatePattern }
					onError={ handleError }
				/>
			) }
			{ showTemplatePartModal && (
				<CreateTemplatePartModal
					closeModal={ () => setShowTemplatePartModal( false ) }
					blocks={ [] }
					onCreate={ handleCreateTemplatePart }
					onError={ handleError }
				/>
			) }
		</>
	);
}
