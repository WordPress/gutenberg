import React from 'react';
import { Command } from 'cmdk';
import { useState } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import {
	chevronLeft,
	handle,
	Icon,
	page as pageIcon,
	post as postIcon,
	plus as plusIcon,
} from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';
import { useLink } from '../routes/link';
import { useHistory } from '../routes';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editSiteStore } from '../../store';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { unlock } from '../../private-apis';

const CommandMenu = () => {
	const history = useHistory();

	const [ open, setOpen ] = React.useState( false );
	const [ search, setSearch ] = React.useState( '' );
	const [ pages, setPages ] = React.useState( [] );
	const page = pages[ pages.length - 1 ];

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { setTemplate, setCanvasMode } = unlock(
		useDispatch( editSiteStore )
	);

	// get pages
	const { records: pageRecords, isResolving: isLoadingPages } =
		useEntityRecords( 'postType', 'page', {
			per_page: -1,
		} );

	// get posts
	const { records: postRecords, isResolving: isLoadingPosts } =
		useEntityRecords( 'postType', 'post', {
			per_page: -1,
		} );

	const handleRecordSelect = ( { type, id } ) => {
		history.push( {
			postId: id,
			postType: type,
		} );
		setOpen( false );
	};

	const handleRecordCreate = async ( { type } ) => {
		try {
			const newRecord = await saveEntityRecord(
				'postType',
				type,
				{
					status: 'publish',
					title: 'New ' + type,
				},
				{ throwOnError: true }
			);

			// Set template before navigating away to avoid initial stale value.
			setTemplate( newRecord.id, newRecord.slug );

			// Navigate to the created template editor.
			history.push( {
				postId: newRecord.id,
				postType: newRecord.type,
			} );

			setOpen( false );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					type
				),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the template.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	};

	// Toggle the menu when ⌘K is pressed
	React.useEffect( () => {
		const down = ( e ) => {
			if ( e.key === 'k' && e.metaKey ) {
				setOpen( ( open ) => ! open );
			}
		};

		document.addEventListener( 'keydown', down );
		return () => document.removeEventListener( 'keydown', down );
	}, [] );

	return open ? (
		<Modal className="cmd-modal" onRequestClose={ () => setOpen( false ) }>
			<div className="wordpress">
				<Command label="Global Command Menu">
					<div className="cmd-header">
						{ pages.length > 0 && (
							<Button onClick={ () => setPages( [] ) }>
								<Icon icon={ chevronLeft } size={ 24 } />
							</Button>
						) }
						<Command.Input
							autoFocus
							value={ search }
							onValueChange={ setSearch }
							placeholder="Type a command or search..."
						/>
					</div>
					<Command.List>
						<Command.Empty>No results found.</Command.Empty>
						{ ! page && (
							<>
								<Command.Item
									onSelect={ () =>
										setPages( [ ...pages, 'pages' ] )
									}
								>
									<Icon icon={ pageIcon } size={ 24 } />
									Search pages...
									<div cmdk-linear-shortcuts="">
										{ [ 'p' ].map( ( key ) => {
											return (
												<kbd key={ key }>{ key }</kbd>
											);
										} ) }
									</div>
								</Command.Item>
								<Command.Item
									onSelect={ () =>
										setPages( [ ...pages, 'posts' ] )
									}
								>
									<Icon icon={ postIcon } size={ 24 } />
									Search posts...
									<div cmdk-linear-shortcuts="">
										{ [ 'p' ].map( ( key ) => {
											return (
												<kbd key={ key }>{ key }</kbd>
											);
										} ) }
									</div>
								</Command.Item>
								<Command.Item
									onSelect={ () =>
										handleRecordCreate( { type: 'page' } )
									}
								>
									<Icon icon={ plusIcon } size={ 24 } />
									Create page
									<div cmdk-linear-shortcuts="">
										{ [ 'c' ].map( ( key ) => {
											return (
												<kbd key={ key }>{ key }</kbd>
											);
										} ) }
									</div>
								</Command.Item>
								<Command.Item
									onSelect={ () =>
										handleRecordCreate( { type: 'post' } )
									}
								>
									<Icon icon={ plusIcon } size={ 24 } />
									Create post
									<div cmdk-linear-shortcuts="">
										{ [ 'c' ].map( ( key ) => {
											return (
												<kbd key={ key }>{ key }</kbd>
											);
										} ) }
									</div>
								</Command.Item>
								<Command.Item
									onSelect={ () =>
										setPages( [ ...pages, 'teams' ] )
									}
								>
									Join a team…
								</Command.Item>
							</>
						) }

						{ page === 'pages' && (
							<>
								{ pageRecords.map( ( pageItem ) => (
									<Command.Item
										key={ pageItem.id }
										onSelect={ () =>
											handleRecordSelect( {
												type: 'page',
												id: pageItem.id,
											} )
										}
									>
										{ pageItem.title.raw }
									</Command.Item>
								) ) }
							</>
						) }

						{ page === 'posts' && (
							<>
								{ postRecords.map( ( postItem ) => (
									<Command.Item
										key={ postItem.id }
										onSelect={ () =>
											handleRecordSelect( {
												type: 'post',
												id: postItem.id,
											} )
										}
									>
										{ postItem.title.raw }
									</Command.Item>
								) ) }
							</>
						) }

						{ page === 'teams' && (
							<>
								<Command.Item>Team 1</Command.Item>
								<Command.Item>Team 2</Command.Item>
							</>
						) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	) : null;
};

export default CommandMenu;
