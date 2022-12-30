/**
 * External dependencies
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { request } from '@playwright/test';
import type { APIRequestContext, Cookie } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WP_ADMIN_USER, WP_BASE_URL } from '../config';
import type { User } from './login';
import { login } from './login';
import { listMedia, uploadMedia, deleteMedia, deleteAllMedia } from './media';
import { createUser, deleteAllUsers } from './users';
import { setupRest, rest, getMaxBatchSize, batchRest } from './rest';
import { getPluginsMap, activatePlugin, deactivatePlugin } from './plugins';
import { deleteAllTemplates } from './templates';
import { activateTheme } from './themes';
import { deleteAllBlocks } from './blocks';
import { createComment, deleteAllComments } from './comments';
import { createPost, deleteAllPosts } from './posts';
import { resetPreferences } from './preferences';
import { getSiteSettings, updateSiteSettings } from './site-settings';
import { deleteAllWidgets, addWidgetBlock } from './widgets';

interface StorageState {
	cookies: Cookie[];
	nonce: string;
	rootURL: string;
}

class RequestUtils {
	request: APIRequestContext;
	user: User;
	maxBatchSize?: number;
	storageState?: StorageState;
	storageStatePath?: string;
	baseURL?: string;

	pluginsMap: Record< string, string > | null = null;

	static async setup( {
		user,
		storageStatePath,
		baseURL = WP_BASE_URL,
	}: {
		user?: User;
		storageStatePath?: string;
		baseURL?: string;
	} ) {
		let storageState: StorageState | undefined;
		if ( storageStatePath ) {
			await fs.mkdir( path.dirname( storageStatePath ), {
				recursive: true,
			} );

			try {
				storageState = JSON.parse(
					await fs.readFile( storageStatePath, 'utf-8' )
				);
			} catch ( error ) {
				if (
					error instanceof Error &&
					( error as NodeJS.ErrnoException ).code === 'ENOENT'
				) {
					// Ignore errors if the state is not found.
				} else {
					throw error;
				}
			}
		}

		const requestContext = await request.newContext( {
			baseURL,
			storageState: storageState && {
				cookies: storageState.cookies,
				origins: [],
			},
		} );

		const requestUtils = new RequestUtils( requestContext, {
			user,
			storageState,
			storageStatePath,
			baseURL,
		} );

		return requestUtils;
	}

	constructor(
		requestContext: APIRequestContext,
		{
			user = WP_ADMIN_USER,
			storageState,
			storageStatePath,
			baseURL = WP_BASE_URL,
		}: {
			user?: User;
			storageState?: StorageState;
			storageStatePath?: string;
			baseURL?: string;
		} = {}
	) {
		this.user = user;
		this.request = requestContext;
		this.storageStatePath = storageStatePath;
		this.storageState = storageState;
		this.baseURL = baseURL;
	}

	login = login.bind( this );
	setupRest = setupRest.bind( this );
	// .bind() drops the generic types. Re-casting it to keep the type signature.
	rest = rest.bind( this ) as typeof rest;
	getMaxBatchSize = getMaxBatchSize.bind( this );
	// .bind() drops the generic types. Re-casting it to keep the type signature.
	batchRest = batchRest.bind( this ) as typeof batchRest;
	getPluginsMap = getPluginsMap.bind( this );
	activatePlugin = activatePlugin.bind( this );
	deactivatePlugin = deactivatePlugin.bind( this );
	activateTheme = activateTheme.bind( this );
	deleteAllBlocks = deleteAllBlocks;
	createPost = createPost.bind( this );
	deleteAllPosts = deleteAllPosts.bind( this );
	createComment = createComment.bind( this );
	deleteAllComments = deleteAllComments.bind( this );
	deleteAllWidgets = deleteAllWidgets.bind( this );
	addWidgetBlock = addWidgetBlock.bind( this );
	deleteAllTemplates = deleteAllTemplates.bind( this );
	resetPreferences = resetPreferences.bind( this );
	listMedia = listMedia.bind( this );
	uploadMedia = uploadMedia.bind( this );
	deleteMedia = deleteMedia.bind( this );
	deleteAllMedia = deleteAllMedia.bind( this );
	createUser = createUser.bind( this );
	deleteAllUsers = deleteAllUsers.bind( this );
	getSiteSettings = getSiteSettings.bind( this );
	updateSiteSettings = updateSiteSettings.bind( this );
}

export type { StorageState };
export { RequestUtils };
