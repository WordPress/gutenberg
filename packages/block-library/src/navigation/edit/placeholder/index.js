/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const PLACEHOLDER_STEPS = {
	selectNavigationPost: 1,
	createInnerBlocks: 2,
};

/**
 * Internal dependencies
 */
import SelectNavigationPostStep from './select-navigation-post-step';
import CreateInnerBlocksStep from './create-inner-blocks-step';

export default function Placeholder( {
	onFinish,
	canSwitchNavigationPost,
	hasResolvedNavigationPosts,
} ) {
	const [ step, setStep ] = useState(
		PLACEHOLDER_STEPS.selectNavigationPost
	);
	const [ navigationPostTitle, setNavigationPostTitle ] = useState( '' );
	const { saveEntityRecord } = useDispatch( coreStore );

	const createNavigationPost = useCallback(
		async ( title = __( 'Untitled Menu' ), blocks = [] ) => {
			// If we have `area` set from block attributes, means an exposed
			// block variation was inserted. So add this prop to the template
			// part entity on creation. Afterwards remove `area` value from
			// block attributes.
			const record = {
				title,
				content: serialize( blocks ),
				status: 'publish',
			};

			const navigationPost = await saveEntityRecord(
				'postType',
				'wp_navigation',
				record
			);

			return navigationPost;
		},
		[ serialize, saveEntityRecord ]
	);

	return (
		<>
			{ step === PLACEHOLDER_STEPS.selectNavigationPost && (
				<SelectNavigationPostStep
					onCreateNew={ ( newTitle ) => {
						setNavigationPostTitle( newTitle );
						setStep( PLACEHOLDER_STEPS.createInnerBlocks );
					} }
					onSelectExisting={ ( navigationPost ) => {
						onFinish( navigationPost );
					} }
					canSwitchNavigationPost={ canSwitchNavigationPost }
					hasResolvedNavigationPosts={ hasResolvedNavigationPosts }
				/>
			) }
			{ step === PLACEHOLDER_STEPS.createInnerBlocks && (
				<CreateInnerBlocksStep
					onFinish={ async ( blocks ) => {
						const navigationPost = await createNavigationPost(
							navigationPostTitle,
							blocks
						);
						onFinish( navigationPost );
					} }
				/>
			) }
		</>
	);
}
