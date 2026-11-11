import { SnackbarList } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, Card, Stack, SwitchControl, Tooltip } from '@wordpress/ui';
import styles from './save-and-submit.module.css';

const SAVE_DURATION = 1500;
const SAVED_MESSAGE = 'Changes saved';
const FEATURES = [
	{
		id: 'comments',
		label: 'Allow comments',
		description: 'Let visitors comment on new posts.',
	},
	{
		id: 'relatedPosts',
		label: 'Show related posts',
		description: 'Display links to similar posts below each post.',
	},
	{
		id: 'lazyLoading',
		label: 'Enable lazy loading',
		description: 'Load images only as visitors scroll to them.',
	},
] as const;

type FeatureId = ( typeof FEATURES )[ number ][ 'id' ];

/**
 * Saves a form behind an explicit "Save changes" button.
 *
 * The button is disabled while there is nothing to save, shows its loading
 * state while saving, and a `SnackbarList` confirms the save. `Snackbar`
 * announces the message politely, so the example does not add a second
 * live region.
 */
export function SaveFormLayoutCardExample() {
	const [ savedData, setSavedData ] = useState( { title: '' } );
	const [ data, setData ] = useState( savedData );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	const noticeIdRef = useRef( 0 );
	const hasChanges = data.title !== savedData.title;

	useEffect( () => {
		if ( ! isSaving ) {
			return;
		}
		const timeoutId = setTimeout( () => {
			setSavedData( data );
			setIsSaving( false );
			noticeIdRef.current += 1;
			setNotices( [
				{ id: String( noticeIdRef.current ), content: SAVED_MESSAGE },
			] );
		}, SAVE_DURATION );
		return () => clearTimeout( timeoutId );
	}, [ isSaving, data ] );

	function onRemove( id: string ) {
		setNotices( ( current ) =>
			current.filter( ( notice ) => notice.id !== id )
		);
	}

	return (
		<div className={ styles.container }>
			<Card.Root className={ styles.card }>
				<Card.Content>
					<Stack direction="column" gap="lg">
						<DataForm
							data={ data }
							fields={ [
								{
									id: 'title',
									label: 'Title',
									type: 'text',
								},
							] }
							form={ {
								layout: { type: 'regular' },
								fields: [ 'title' ],
							} }
							onChange={ ( edits ) =>
								setData( ( previous ) => ( {
									...previous,
									...edits,
								} ) )
							}
						/>
						<Stack>
							<Tooltip.Root disabled={ hasChanges }>
								<Tooltip.Trigger
									render={
										<Button
											disabled={
												isSaving || ! hasChanges
											}
											loading={ isSaving }
											loadingAnnouncement="Saving changes"
											onClick={ () =>
												setIsSaving( true )
											}
										>
											Save changes
										</Button>
									}
								/>
								<Tooltip.Popup>
									No unsaved changes
								</Tooltip.Popup>
							</Tooltip.Root>
						</Stack>
					</Stack>
				</Card.Content>
			</Card.Root>
			<SnackbarList
				className={ styles.snackbars }
				notices={ notices }
				onRemove={ onRemove }
			/>
		</div>
	);
}

/**
 * Saves each switch as soon as it is flipped.
 *
 * There is no Save button, and the switch itself shows the new state.
 */
export function AutosaveFeatureListExample() {
	const [ values, setValues ] = useState< Record< FeatureId, boolean > >( {
		comments: true,
		relatedPosts: false,
		lazyLoading: true,
	} );

	return (
		<Card.Root className={ styles.card }>
			<Card.Header>
				<Card.Title>Features</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ FEATURES.map( ( feature ) => (
						<SwitchControl
							key={ feature.id }
							label={ feature.label }
							description={ feature.description }
							checked={ values[ feature.id ] }
							onCheckedChange={ ( checked ) =>
								setValues( ( current ) => ( {
									...current,
									[ feature.id ]: checked,
								} ) )
							}
						/>
					) ) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
