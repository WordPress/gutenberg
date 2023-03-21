/**
 * External dependencies
 */
import React from 'react';
import { Command } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import {
	chevronLeft,
	handle,
	Icon,
	page as pageIcon,
	post as postIcon,
	plus as plusIcon,
	styles as stylesIcon,
	close as closeIcon,
	settings as settingsIcon,
	commentAuthorAvatar as aiIcon,
} from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';
import { unlock } from '../../private-apis';
import { STORE_NAME } from '../../store/constants';
import { store as editSiteStore } from '../../store';

const CommandMenu = () => {
	const history = useHistory();

	const [ open, setOpen ] = React.useState( false );
	const [ search, setSearch ] = React.useState( '' );
	const [ pages, setPages ] = React.useState( [] );
	const page = pages[ pages.length - 1 ];

	const { saveEntityRecord } = useDispatch( coreStore );
	const { removeBlock, insertBlocks } = useDispatch( blockEditorStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { setTemplate, setCanvasMode } = unlock(
		useDispatch( editSiteStore )
	);

	const selectedBlock = useSelect( ( select ) => {
		return select( blockEditorStore ).getSelectedBlock();
	}, [] );

	React.useEffect( () => {
		if ( selectedBlock ) {
			setPages( [ 'block' ] );
		}
	}, [ selectedBlock ] );

	const { enableComplementaryArea } = useDispatch( interfaceStore );

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

	useShortcut( 'core/command-center', ( event ) => {
		setSearch( '' );
		setOpen( ( open ) => ! open );
	} );

	const handleStyleSelect = () => {
		setOpen( false );
		setCanvasMode( 'edit' );
		enableComplementaryArea( STORE_NAME, 'edit-site/global-styles' );
	};

	const commandPlaceholder =
		page === 'ai'
			? 'Ask WordPress AI anything...'
			: 'Type a command or search...';

	const commands = [
		{
			command: () => {
				insertBlocks( [ 'core/paragraph' ] );
			},
			label: 'Add a paragraph',
			matchers: [ 'add a paragraph', 'insert a paragraph' ],
		},
	];

	const matchedCommands = commands.filter( ( command ) =>
		command.matchers.includes( search )
	);

	return open ? (
		<Modal className="cmd-modal" onRequestClose={ () => setOpen( false ) }>
			<div className="wordpress">
				<Command label="Global Command Menu">
					{ page === 'block' && (
						<div className="page-name">{ selectedBlock.name }</div>
					) }
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
							placeholder={ commandPlaceholder }
						/>
					</div>
					<Command.List>
						<Command.Empty>No results found.</Command.Empty>
						{ ! page && (
							<>
								<Command.Item
									onSelect={ () =>
										setPages( [ ...pages, 'ai' ] )
									}
								>
									<Icon icon={ aiIcon } size={ 24 } />
									Ask WordPress AI
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
								<Command.Item onSelect={ handleStyleSelect }>
									<Icon icon={ stylesIcon } size={ 24 } />
									Style your site
								</Command.Item>
							</>
						) }

						{ page === 'block' && (
							<>
								<Command.Item
									onSelect={ () => {
										setOpen( false );
										enableComplementaryArea(
											STORE_NAME,
											'edit-site/block-inspector'
										);
									} }
								>
									<Icon icon={ settingsIcon } size={ 24 } />
									Change block settings
								</Command.Item>
								<Command.Item
									onSelect={ () => {
										setOpen( false );
										removeBlock( selectedBlock.clientId );
									} }
								>
									<Icon icon={ closeIcon } size={ 24 } />
									Delete block
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
						{ page === 'ai' && (
							<>
								{ matchedCommands.map( ( command, index ) => (
									<Command.Item
										key={ index }
										onSelect={ command.command }
									>
										{ command.label }
									</Command.Item>
								) ) }
							</>
						) }
					</Command.List>
				</Command>
			</div>
		</Modal>
	) : null;
};

export default CommandMenu;
