/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, __experimentalText as Text } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostExcerptForm from './index';
import PostExcerptCheck from './check';
import PluginPostExcerpt from './plugin';
import { store as editorStore } from '../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-excerpt';

function ExcerptPanel() {
	const { isOpened, isEnabled, postType } = useSelect( ( select ) => {
		const {
			isEditorPanelOpened,
			isEditorPanelEnabled,
			getCurrentPostType,
		} = select( editorStore );

		return {
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			postType: getCurrentPostType(),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editorStore );
	const toggleExcerptPanel = () => toggleEditorPanelOpened( PANEL_NAME );

	if ( ! isEnabled ) {
		return null;
	}

	// There are special cases where we want to label the excerpt as a description.
	const shouldUseDescriptionLabel = [
		'wp_template',
		'wp_template_part',
		'wp_block',
	].includes( postType );

	return (
		<PanelBody
			title={
				shouldUseDescriptionLabel
					? __( 'Description' )
					: __( 'Excerpt' )
			}
			opened={ isOpened }
			onToggle={ toggleExcerptPanel }
		>
			<PluginPostExcerpt.Slot>
				{ ( fills ) => (
					<>
						<PostExcerptForm />
						{ fills }
					</>
				) }
			</PluginPostExcerpt.Slot>
		</PanelBody>
	);
}

export default function PostExcerptPanel() {
	return (
		<PostExcerptCheck>
			<ExcerptPanel />
		</PostExcerptCheck>
	);
}

function PrivateExcerpt() {
	const { isEnabled, excerpt } = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getEditedPostAttribute,
			isEditorPanelEnabled,
		} = select( editorStore );
		const postType = getCurrentPostType();
		const shouldBeUsedAsDescription = [
			'wp_template',
			'wp_template_part',
			'wp_block',
		].includes( postType );
		// This special case is unfortunate, but the REST API of wp_template and wp_template_part
		// support the excerpt field throught the "description" field rather than "excerpt".
		const _usedAttribute = [ 'wp_template', 'wp_template_part' ].includes(
			postType
		)
			? 'description'
			: 'excerpt';
		return {
			excerpt: getEditedPostAttribute( _usedAttribute ),
			// When we are rendering the excerpt/description for templates, template parts
			// and patterns, do not abide by the `isEnabled` panel flag.
			isEnabled:
				isEditorPanelEnabled( PANEL_NAME ) || shouldBeUsedAsDescription,
		};
	}, [] );
	if ( ! isEnabled ) {
		return null;
	}
	return (
		<div className="editor-post-excerpt__text-container">
			<Text>{ excerpt }</Text>
		</div>
	);
}

export function PrivatePostExcerptPanel() {
	return (
		<PostExcerptCheck>
			<PrivateExcerpt />
		</PostExcerptCheck>
	);
}
