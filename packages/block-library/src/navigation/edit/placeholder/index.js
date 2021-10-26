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
import SelectNavigationMenuStep from './select-navigation-menu-step';
import CreateInnerBlocksStep from './create-inner-blocks-step';

export default function Placeholder( {
	onFinish,
	canSwitchNavigationMenu,
	hasResolvedNavigationMenu,
} ) {
	const [ step, setStep ] = useState(
		PLACEHOLDER_STEPS.selectNavigationPost
	);
	const [ navigationMenuTitle, setNavigationMenuTitle ] = useState( '' );
	const { saveEntityRecord } = useDispatch( coreStore );

	// This callback uses data from the two placeholder steps and only creates
	// a new navigation menu when the user completes the final step.
	const createNavigationMenu = useCallback(
		async ( title = __( 'Untitled Navigation Menu' ), blocks = [] ) => {
			const record = {
				title,
				content: serialize( blocks ),
				status: 'publish',
			};

			const navigationMenu = await saveEntityRecord(
				'postType',
				'wp_navigation',
				record
			);

			return navigationMenu;
		},
		[ serialize, saveEntityRecord ]
	);

	return (
		<>
			{ step === PLACEHOLDER_STEPS.selectNavigationPost && (
				<SelectNavigationMenuStep
					onCreateNew={ ( newTitle ) => {
						setNavigationMenuTitle( newTitle );
						setStep( PLACEHOLDER_STEPS.createInnerBlocks );
					} }
					onSelectExisting={ ( navigationMenu ) => {
						onFinish( navigationMenu );
					} }
					canSwitchNavigationMenu={ canSwitchNavigationMenu }
					hasResolvedNavigationMenu={ hasResolvedNavigationMenu }
				/>
			) }
			{ step === PLACEHOLDER_STEPS.createInnerBlocks && (
				<CreateInnerBlocksStep
					onFinish={ async ( blocks ) => {
						const navigationMenu = await createNavigationMenu(
							navigationMenuTitle,
							blocks
						);
						onFinish( navigationMenu );
					} }
				/>
			) }
		</>
	);
}
