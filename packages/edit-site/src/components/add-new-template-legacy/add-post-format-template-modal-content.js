/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Flex,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { focus } from '@wordpress/dom';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { usePostFormatMenuItems } from './utils';

function AddPostFormatTemplateModalContent( {
	onSelect,
	onBack,
	containerRef,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );
	const { availableFormats: postFormats } = usePostFormatMenuItems();

	// Focus the first focusable element when the component mounts.
	useEffect( () => {
		if ( containerRef?.current ) {
			const [ firstFocusable ] = focus.focusable.find(
				containerRef.current
			);
			firstFocusable?.focus();
		}
	}, [ containerRef ] );

	return (
		<Stack
			direction="column"
			gap="lg"
			className="edit-site-custom-template-modal__contents-wrapper"
			align="flex-start"
		>
			<Text variant="body-md" render={ <p /> }>
				{ __(
					'Select the post format to create an archive template for:'
				) }
			</Text>
			<Grid
				columns={ isMobile ? 2 : 3 }
				gap={ 4 }
				align="flex-start"
				justify="center"
				className="edit-site-custom-template-modal__contents"
			>
				{ postFormats.map( ( format ) => (
					<Button
						__next40pxDefaultSize
						key={ format.slug }
						onClick={ () => onSelect( format ) }
					>
						<Text variant="heading-md">{ format.title }</Text>
						{ format.description && (
							<Text variant="body-md">
								{ format.description }
							</Text>
						) }
					</Button>
				) ) }
			</Grid>
			<Flex justify="right">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onBack }
				>
					{ __( 'Back' ) }
				</Button>
			</Flex>
		</Stack>
	);
}

export default AddPostFormatTemplateModalContent;
