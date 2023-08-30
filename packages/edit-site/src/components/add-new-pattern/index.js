/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus, symbol, symbolFilled } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';
import SidebarButton from '../sidebar-button';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );
const { CreatePatternModal } = unlock( editPatternsPrivateApis );

export default function AddNewPattern() {
	const history = useHistory();
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );

	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme()?.is_block_theme;
	}, [] );

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

	const controls = [
		{
			icon: symbol,
			onClick: () => setShowPatternModal( true ),
			title: __( 'Create pattern' ),
		},
	];

	if ( isBlockBasedTheme ) {
		controls.push( {
			icon: symbolFilled,
			onClick: () => setShowTemplatePartModal( true ),
			title: __( 'Create template part' ),
		} );
	}

	return (
		<>
			<DropdownMenu
				controls={ controls }
				toggleProps={ {
					as: SidebarButton,
				} }
				icon={ plus }
				label={ __( 'Create pattern' ) }
			/>
			{ showPatternModal && (
				<CreatePatternModal
					onClose={ () => setShowPatternModal( false ) }
					onSuccess={ handleCreatePattern }
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
