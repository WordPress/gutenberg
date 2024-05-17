/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Dropdown,
	RadioControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

const COMMENT_OPTIONS = [
	{
		label: (
			<>
				{ __( 'Open' ) }
				<Text variant="muted" size={ 12 }>
					{ __( 'Visitors can add new comments and replies.' ) }
				</Text>
			</>
		),
		value: 'open',
	},
	{
		label: (
			<>
				{ __( 'Closed' ) }
				<Text variant="muted" size={ 12 }>
					{ __( 'Visitors cannot add new comments or replies.' ) }
				</Text>
				<Text variant="muted" size={ 12 }>
					{ __( 'Existing comments remain visible.' ) }
				</Text>
			</>
		),
		value: '',
	},
];

export default function DiscussionPanel() {
	const { editEntityRecord } = useDispatch( coreStore );
	const allowCommentsOnNewPosts = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		return siteSettings?.default_comment_status || '';
	}, [] );
	const [ commentsOnNewPostsValue, setCommentsOnNewPostsValue ] =
		useState( '' );
	/*
	 * This hook serves to set the server-retrieved allowCommentsOnNewPosts
	 * value to local state.
	 */
	useEffect( () => {
		setCommentsOnNewPostsValue( allowCommentsOnNewPosts );
	}, [ allowCommentsOnNewPosts ] );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);
	const setAllowCommentsOnNewPosts = ( newValue ) => {
		setCommentsOnNewPostsValue( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			default_comment_status: newValue ? 'open' : null,
		} );
	};
	return (
		<PostPanelRow label={ __( 'Discussion' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-site-settings-dropdown__content"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						aria-expanded={ isOpen }
						aria-label={ __( 'Change discussion settings' ) }
						onClick={ onToggle }
					>
						{ commentsOnNewPostsValue
							? __( 'Comments open' )
							: __( 'Comments closed' ) }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<>
						<InspectorPopoverHeader
							title={ __( 'Discussion' ) }
							onClose={ onClose }
						/>
						<VStack spacing={ 3 }>
							<Text>
								{ __(
									'Changes will apply to new posts only. Individual posts may override these settings.'
								) }
							</Text>
							<RadioControl
								className="editor-comment-status__options"
								hideLabelFromVision
								label={ __( 'Comment status' ) }
								options={ COMMENT_OPTIONS }
								onChange={ setAllowCommentsOnNewPosts }
								selected={ commentsOnNewPostsValue }
							/>
						</VStack>
					</>
				) }
			/>
		</PostPanelRow>
	);
}
