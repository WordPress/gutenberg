/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalText as Text,
	Dropdown,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

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

export function PrivatePostExcerptPanel() {
	return (
		<PostExcerptCheck>
			<PrivateExcerpt />
		</PostExcerptCheck>
	);
}

function PrivateExcerpt() {
	const { isEnabled, excerpt, shouldBeUsedAsDescription } = useSelect(
		( select ) => {
			const {
				getCurrentPostType,
				getEditedPostAttribute,
				isEditorPanelEnabled,
			} = select( editorStore );
			const postType = getCurrentPostType();
			const _shouldBeUsedAsDescription = [
				'wp_template',
				'wp_template_part',
				'wp_block',
			].includes( postType );
			// This special case is unfortunate, but the REST API of wp_template and wp_template_part
			// support the excerpt field throught the "description" field rather than "excerpt".
			const _usedAttribute = [
				'wp_template',
				'wp_template_part',
			].includes( postType )
				? 'description'
				: 'excerpt';
			return {
				excerpt: getEditedPostAttribute( _usedAttribute ),
				// When we are rendering the excerpt/description for templates, template parts
				// and patterns, do not abide by the `isEnabled` panel flag.
				isEnabled:
					isEditorPanelEnabled( PANEL_NAME ) ||
					_shouldBeUsedAsDescription,
				shouldBeUsedAsDescription: _shouldBeUsedAsDescription,
			};
		},
		[]
	);
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const label = shouldBeUsedAsDescription
		? __( 'Description' )
		: __( 'Excerpt' );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': label,
			headerTitle: label,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor, label ]
	);

	if ( ! isEnabled ) {
		return null;
	}

	// TODO: if not editable show just text..

	// TODO: if empty should have placeholder...
	// we need to make different checks for `wp_block`
	// type and template/template parts. The reason for this is that we want to allow
	// editing excerpt/description for templates/template parts that are
	// user generated and this shouldn't abide by the isPanelEnabled flag.
	// const canEditExcerpt =
	// 	isRemovable ||
	// 	( eligibleToEditExcerpt && template?.type === 'wp_block' );

	return (
		<Dropdown
			contentClassName="editor-post-excerpt__dropdown__content"
			popoverProps={ popoverProps }
			focusOnMount
			ref={ setPopoverAnchor }
			renderToggle={ ( { onToggle } ) => (
				<Button
					className="editor-post-excerpt__dropdown__trigger"
					onClick={ onToggle }
				>
					<Text align="left">{ excerpt }</Text>
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<InspectorPopoverHeader
						title={ label }
						onClose={ onClose }
					/>

					<VStack spacing={ 4 }>
						<PluginPostExcerpt.Slot>
							{ ( fills ) => (
								<>
									<PostExcerptForm />
									{ fills }
								</>
							) }
						</PluginPostExcerpt.Slot>
					</VStack>
				</>
			) }
		/>
	);
}
