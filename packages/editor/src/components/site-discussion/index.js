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
import { useState, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

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

export default function SiteDiscussion() {
	const { editEntityRecord } = useDispatch( coreStore );
	const { allowCommentsOnNewPosts, isTemplate, postSlug } = useSelect(
		( select ) => {
			const { getEditedPostAttribute, getCurrentPostType } =
				select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const siteSettings = getEditedEntityRecord( 'root', 'site' );
			return {
				isTemplate: getCurrentPostType() === TEMPLATE_POST_TYPE,
				postSlug: getEditedPostAttribute( 'slug' ),
				allowCommentsOnNewPosts:
					siteSettings?.default_comment_status || '',
			};
		},
		[]
	);
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

	if ( ! isTemplate || ! [ 'home', 'index' ].includes( postSlug ) ) {
		return null;
	}
	const setAllowCommentsOnNewPosts = ( newValue ) => {
		editEntityRecord( 'root', 'site', undefined, {
			default_comment_status: newValue ? 'open' : null,
		} );
	};
	return (
		<PostPanelRow label={ __( 'Discussion' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-site-discussion-dropdown__content"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						aria-expanded={ isOpen }
						aria-label={ __( 'Change discussion settings' ) }
						onClick={ onToggle }
					>
						{ allowCommentsOnNewPosts
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
								className="editor-site-discussion__options"
								hideLabelFromVision
								label={ __( 'Comment status' ) }
								options={ COMMENT_OPTIONS }
								onChange={ setAllowCommentsOnNewPosts }
								selected={ allowCommentsOnNewPosts }
							/>
						</VStack>
					</>
				) }
			/>
		</PostPanelRow>
	);
}
