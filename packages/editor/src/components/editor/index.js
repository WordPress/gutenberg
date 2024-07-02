/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import EditorInterface from '../editor-interface';
import { ExperimentalEditorProvider } from '../provider';
import Sidebar from '../sidebar';

function Editor( {
	postType,
	postId,
	templateId,
	settings,
	children,

	// This could be part of the settings.
	onActionPerformed,

	// The following abstractions are not ideal but necessary
	// to account for site editor and post editor differences for now.
	className,
	styles,
	customSaveButton,
	customSavePanel,
	forceDisableBlockTools,
	title,
	iframeProps,
	extraSidebarPanels,
	enableRegionNavigation = true,
} ) {
	const { post, template, hasLoadedPost } = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			return {
				post: getEntityRecord( 'postType', postType, postId ),
				template: templateId
					? getEntityRecord(
							'postType',
							TEMPLATE_POST_TYPE,
							templateId
					  )
					: undefined,
				hasLoadedPost: hasFinishedResolution( 'getEntityRecord', [
					'postType',
					postType,
					postId,
				] ),
			};
		},
		[ postType, postId, templateId ]
	);

	if ( ! post ) {
		return null;
	}

	return (
		<ExperimentalEditorProvider
			post={ post }
			__unstableTemplate={ template }
			settings={ settings }
			useSubRegistry={ false }
		>
			{ hasLoadedPost && ! post && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
					) }
				</Notice>
			) }
			<EditorInterface
				className={ className }
				styles={ styles }
				enableRegionNavigation={ enableRegionNavigation }
				customSaveButton={ customSaveButton }
				customSavePanel={ customSavePanel }
				forceDisableBlockTools={ forceDisableBlockTools }
				title={ title }
				iframeProps={ iframeProps }
			/>
			<Sidebar
				onActionPerformed={ onActionPerformed }
				extraPanels={ extraSidebarPanels }
			/>
			{ children }
		</ExperimentalEditorProvider>
	);
}

export default Editor;
