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
import { Text } from '@wordpress/ui';
import { VISIBILITY_OPTIONS } from './utils';
import { store as editorStore } from '../../store';

/**
 * Allows users to set the visibility of a post.
 *
 * @param {Object}   props         The component props.
 * @param {Function} props.onClose Function to call when the popover is closed.
 * @return {React.ReactNode} The rendered component.
 */
export default function PostVisibility( props ) {
	return <PrivatePostVisibility { ...props } showPopoverHeader />;
}

/**
 * Allows users to set the visibility of a post.
 *
 * @param {Object}   props                   The component props.
 * @param {Function} props.onClose           Function to call when the popover is closed.
 * @param {boolean}  props.showPopoverHeader Whether to render the popover header. Set it
 *                                           to `false` when the component is rendered
 *                                           inline, where the surrounding UI already
 *                                           provides a heading.
 * @return {React.ReactNode} The rendered component.
 */
export function PrivatePostVisibility( { onClose, showPopoverHeader } ) {
	const instanceId = useInstanceId( PrivatePostVisibility );

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

	const help = __( 'Control how this post is viewed.' );

	return (
		<div className="editor-post-visibility">
			{ showPopoverHeader && (
				<InspectorPopoverHeader
					title={ __( 'Visibility' ) }
					help={ help }
					onClose={ onClose }
				/>
			) }
			<VStack spacing={ 4 }>
				{ ! showPopoverHeader && (
					<Text render={ <p /> }>{ help }</Text>
				) }
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
						maxLength={ 255 }
					/>
				) }
			</VStack>
		</div>
	);
}
