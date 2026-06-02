/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	TextControl,
	RadioControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { VISIBILITY_OPTIONS } from './utils';
import { store as editorStore } from '../../store';

/**
 * Allows users to set the visibility of a post.
 *
 * @param {Object}   props         The component props.
 * @param {Function} props.onClose Function to call when the popover is closed.
 * @return {React.ReactNode} The rendered component.
 */
export default function PostVisibility( { onClose } ) {
	const instanceId = useInstanceId( PostVisibility );

	const { status, visibility, password } = useSelect( ( select ) => ( {
		status: select( editorStore ).getEditedPostAttribute( 'status' ),
		visibility: select( editorStore ).getEditedPostVisibility(),
		password: select( editorStore ).getEditedPostAttribute( 'password' ),
	} ) );

	const { editPost } = useDispatch( editorStore );

	const [ hasPassword, setHasPassword ] = useState( !! password );

	function updateVisibility( value ) {
		const nextValues = {
			public: {
				status: visibility === 'private' ? 'draft' : status,
				password: '',
			},
			private: { status: 'private', password: '' },
			password: {
				status: visibility === 'private' ? 'draft' : status,
				password: password || '',
			},
		};

		editPost( nextValues[ value ] );
		setHasPassword( value === 'password' );
	}

	const updatePassword = ( value ) => {
		editPost( { password: value } );
	};

	return (
		<div className="editor-post-visibility">
			<InspectorPopoverHeader
				title={ __( 'Visibility' ) }
				help={ __( 'Control how this post is viewed.' ) }
				onClose={ onClose }
			/>
			<VStack spacing={ 4 }>
				<RadioControl
					label={ __( 'Visibility' ) }
					hideLabelFromVision
					options={ VISIBILITY_OPTIONS }
					selected={ hasPassword ? 'password' : visibility }
					onChange={ updateVisibility }
				/>
				{ hasPassword && (
					<TextControl
						label={ __( 'Password' ) }
						onChange={ updatePassword }
						value={ password }
						placeholder={ __( 'Use a secure password' ) }
						type="text"
						id={ `editor-post-visibility__password-input-${ instanceId }` }
						__next40pxDefaultSize
						maxLength={ 255 }
					/>
				) }
			</VStack>
		</div>
	);
}
