/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	Icon,
	__experimentalSpacer as Spacer,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';
import { useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import {
	page as pageIcon,
	chevronRight as chevronRightIcon,
	sidebar as sidebarIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { unlock } from '../../../private-apis';
import useEditedEntityRecord from '../../use-edited-entity-record';

// TODO: 'edit focus' could be confused with 'editor mode'
export default function EditFocusSwitcher() {
	const { postType, postId } = useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
	const { hasResolved: hasPostResolved, editedRecord: post } =
		useEntityRecord( 'postType', postType, postId );
	const { isLoaded: isTemplateLoaded } = useEditedEntityRecord();

	const shownNotification = useRef( false );

	const { setEditFocus } = useDispatch( editSiteStore );

	const { editFocus } = useSelect(
		( select ) => ( {
			editFocus: unlock( select( editSiteStore ) ).getEditFocus(),
		} ),
		[]
	);

	const { createInfoNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( editFocus === 'template' && ! shownNotification.current ) {
			shownNotification.current = true;
			createInfoNotice( 'You are editing a template', {
				type: 'snackbar',
				actions: [
					{
						label: 'Back to page',
						onClick: () => {
							setEditFocus( 'post' );
						},
					},
				],
			} );
		}
	}, [ editFocus, createInfoNotice, setEditFocus ] );

	if ( ! hasPostResolved && ! isTemplateLoaded ) {
		return;
	}

	return editFocus === 'post' ? (
		<HStack expanded={ false } spacing={ 2 }>
			<Icon icon={ pageIcon } />
			<div>{ post.title }</div>
		</HStack>
	) : (
		<Flex expanded={ false } gap={ 1 }>
			<Button
				icon={ pageIcon }
				style={ { color: '#757575' } }
				onClick={ () => setEditFocus( 'post' ) }
			>
				{ post.title }
			</Button>
			<Icon
				icon={ chevronRightIcon }
				size={ 16 }
				style={ { fill: '#757575' } }
			/>
			<FlexItem>
				<Spacer padding={ 2 } marginBottom={ 0 }>
					<HStack
						expanded={ false }
						spacing={ 2 }
						style={ { color: 'rgb(114, 47, 166)' } }
					>
						<Icon
							icon={ sidebarIcon }
							style={ { fill: 'rgb(114, 47, 166)' } }
						/>
						<div>{ __( 'Template' ) }</div>
					</HStack>
				</Spacer>
			</FlexItem>
		</Flex>
	);
}
