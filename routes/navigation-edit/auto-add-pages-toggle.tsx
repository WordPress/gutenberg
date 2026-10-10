import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Stack, SwitchControl } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuRecord = {
	meta?: Record< string, unknown >;
};

/**
 * The menu's "Auto add pages" setting. This screen has no save button, so a
 * change is saved as soon as it is made, and only the setting is sent.
 *
 * @param props
 * @param props.id The `wp_navigation` post ID.
 */
export default function AutoAddPagesToggle( { id }: { id: number } ) {
	const isEnabled = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				id
			) as NavigationMenuRecord | undefined;
			return !! record?.meta?.[ META_KEY ];
		},
		[ id ]
	);
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );

	const onCheckedChange = async ( value: boolean ) => {
		setIsSaving( true );
		setHasError( false );
		try {
			await saveEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				{ id, meta: { [ META_KEY ]: value } },
				{ throwOnError: true }
			);
		} catch {
			setHasError( true );
		}
		setIsSaving( false );
	};

	return (
		<Stack direction="column" gap="sm" align="start">
			<SwitchControl
				label={ __( 'Auto add pages' ) }
				description={ __(
					'Add a link to each new top-level page when it is published.'
				) }
				checked={ isEnabled }
				disabled={ isSaving }
				onCheckedChange={ onCheckedChange }
			/>
			{ hasError && (
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'The setting could not be saved. Try again.' ) }
					</Notice.Description>
				</Notice.Root>
			) }
		</Stack>
	);
}
