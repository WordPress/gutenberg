import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { Stack, Text } from '@wordpress/ui';
import type { PostFormatMenuItem } from './utils';

interface AddPostFormatTemplateModalContentProps {
	postFormats: PostFormatMenuItem[];
	onSelect: ( template: PostFormatMenuItem ) => void;
	onBack: () => void;
	containerRef?: React.RefObject< HTMLDivElement | null >;
}

function AddPostFormatTemplateModalContent( {
	postFormats,
	onSelect,
	onBack,
	containerRef,
}: AddPostFormatTemplateModalContentProps ) {
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
			className="template-list-custom-template-modal__contents-wrapper"
			align="flex-start"
		>
			<Text variant="body-md" render={ <p /> }>
				{ __(
					'Select the post format to create an archive template for:'
				) }
			</Text>
			<div className="template-list-custom-template-modal__contents">
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
