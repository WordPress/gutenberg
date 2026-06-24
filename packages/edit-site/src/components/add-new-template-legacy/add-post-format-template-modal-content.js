/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Flex,
	__experimentalGrid as Grid,
	__experimentalText as WCText,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { focus } from '@wordpress/dom';

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
		<VStack
			spacing={ 4 }
			className="edit-site-custom-template-modal__contents-wrapper"
			alignment="left"
		>
			<WCText as="p">
				{ __(
					'Select the post format to create an archive template for:'
				) }
			</WCText>
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
						<WCText
							as="span"
							weight={ 500 }
							lineHeight={ 1.53846153846 } // 20px
						>
							{ format.title }
						</WCText>
						{ format.description && (
							<WCText
								as="span"
								lineHeight={ 1.53846153846 } // 20px
							>
								{ format.description }
							</WCText>
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
		</VStack>
	);
}

export default AddPostFormatTemplateModalContent;
