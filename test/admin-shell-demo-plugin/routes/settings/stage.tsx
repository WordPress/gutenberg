import { Page } from '@wordpress/admin-ui';
import {
	getAlivePageKeys,
	PAGE_CHANGE_EVENT,
	setMaxAlivePages,
	usePageVisibility,
} from '@wordpress/boot';
import { Button } from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { InputControl, Stack, Text } from '@wordpress/ui';

const OPTION = 'admin_shell_demo_max_alive_pages';

/**
 * Lists the pages whose apps the admin shell keeps mounted, and follows its
 * page change event.
 */
function useAlivePages() {
	const [ alivePages, setAlivePages ] = useState( getAlivePageKeys );
	const refresh = () => setAlivePages( getAlivePageKeys() );
	useEffect( () => {
		const onChange = ( event: Event ) =>
			setAlivePages(
				( event as CustomEvent< { alivePageKeys: string[] } > ).detail
					.alivePageKeys
			);
		document.addEventListener( PAGE_CHANGE_EVENT, onChange );
		return () =>
			document.removeEventListener( PAGE_CHANGE_EVENT, onChange );
	}, [] );
	return [ alivePages, refresh ] as const;
}

function Stage() {
	const [ maxAlivePages, setOptionValue ] = useEntityProp(
		'root',
		'site',
		OPTION
	);
	const isSaving = useSelect(
		( select ) =>
			select( coreStore ).isSavingEntityRecord( 'root', 'site' ),
		[]
	);
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const [ alivePages, refreshAlivePages ] = useAlivePages();
	const isVisible = usePageVisibility();

	return (
		<Page
			title={ __( 'Settings' ) }
			subTitle={ __(
				'Try the admin_shell_max_alive_pages filter: this plugin passes the number below to it.'
			) }
			hasPadding
		>
			<Stack direction="column" gap="lg" align="start">
				<InputControl
					label={ __( 'Pages to keep alive' ) }
					description={ __(
						'How many pages stay in memory, including the one showing. When you open one more, the page you looked at least recently is unloaded and loses its state, such as an unsaved note. Applies as soon as you save.'
					) }
					type="number"
					min={ 1 }
					value={ String( maxAlivePages ?? '' ) }
					onChange={ ( event ) =>
						setOptionValue(
							Math.max(
								1,
								parseInt( event.target.value, 10 ) || 1
							)
						)
					}
				/>
				<Button
					__next40pxDefaultSize
					variant="primary"
					isBusy={ isSaving }
					onClick={ async () => {
						await saveEditedEntityRecord( 'root', 'site' );
						// Apply the new limit to the running shell right away.
						setMaxAlivePages( Number( maxAlivePages ) );
						refreshAlivePages();
					} }
				>
					{ __( 'Save' ) }
				</Button>
				<Text>
					{ alivePages.length
						? sprintf(
								/* translators: %s: comma-separated list of admin page slugs. */
								__( 'Pages in memory, least recent first: %s' ),
								alivePages.join( ', ' )
							)
						: __(
								'Switch to another page and back to see which pages stay in memory.'
							) }
				</Text>
				<Text>
					{ isVisible
						? __( 'This page is showing.' )
						: __( 'This page is hidden.' ) }
				</Text>
			</Stack>
		</Page>
	);
}

export const stage = Stage;
