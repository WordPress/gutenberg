import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { Stack, Text } from '@wordpress/ui';
import { usePostFormatMenuItems } from './utils';

type PostFormatTemplate = {
	slug: string;
	title: string;
	description?: string;
};

type AddPostFormatTemplateModalContentProps = {
	onSelect: ( format: PostFormatTemplate ) => void;
	onBack: () => void;
	containerRef: React.RefObject< HTMLDivElement | null >;
};

function AddPostFormatTemplateModalContent( {
	onSelect,
	onBack,
	containerRef,
}: AddPostFormatTemplateModalContentProps ) {
	// We are already past the click action, so we can ignore the entryPoint return value.
	// Casting is needed because utils.js is untyped JavaScript.
	const { availableFormats: postFormats } = usePostFormatMenuItems(
		() => {}
	) as { entryPoint: unknown; availableFormats: PostFormatTemplate[] };

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
			<div className="edit-site-custom-template-modal__contents">
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
			</div>
			<Stack direction="row" justify="flex-end">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onBack }
				>
					{ __( 'Back' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default AddPostFormatTemplateModalContent;
