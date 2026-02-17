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
import { deleteAllTemplates, createTemplate } from './templates';
import { activateTheme } from './themes';
import {
	getCurrentThemeGlobalStylesPostId,
	getThemeGlobalStylesRevisions,
	updateGlobalStyles,
} from './global-styles';
import { createBlock, deleteAllBlocks } from './blocks';
import { createComment, deleteAllComments } from './comments';
import { createPost, deleteAllPosts } from './posts';
import {
	createClassicMenu,
	createNavigationMenu,
	deleteAllMenus,
	getNavigationMenus,
} from './menus';
import { deleteAllPages, createPage } from './pages';
import { resetPreferences } from './preferences';
import { getSiteSettings, updateSiteSettings } from './site-settings';
import { deleteAllWidgets, addWidgetBlock } from './widgets';
import { deleteAllPatternCategories } from './patterns';
import { setGutenbergExperiments } from './gutenberg-experiments';

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

		const requestUtils = new this( requestContext, {
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

	/** @borrows login as this.login */
	login: typeof login = login.bind( this );
	/** @borrows setupRest as this.setupRest */
	setupRest: typeof setupRest = setupRest.bind( this );
	// .bind() drops the generic types. Re-casting it to keep the type signature.
	rest: typeof rest = rest.bind( this ) as typeof rest;
	/** @borrows getMaxBatchSize as this.getMaxBatchSize */
	getMaxBatchSize: typeof getMaxBatchSize = getMaxBatchSize.bind( this );
	// .bind() drops the generic types. Re-casting it to keep the type signature.
	batchRest: typeof batchRest = batchRest.bind( this ) as typeof batchRest;
	/** @borrows getPluginsMap as this.getPluginsMap */
	getPluginsMap: typeof getPluginsMap = getPluginsMap.bind( this );
	/** @borrows activatePlugin as this.activatePlugin */
	activatePlugin: typeof activatePlugin = activatePlugin.bind( this );
	/** @borrows deactivatePlugin as this.deactivatePlugin */
	deactivatePlugin: typeof deactivatePlugin = deactivatePlugin.bind( this );
	/** @borrows activateTheme as this.activateTheme */
	activateTheme: typeof activateTheme = activateTheme.bind( this );
	/** @borrows createBlock as this.createBlock */
	createBlock: typeof createBlock = createBlock.bind( this );
	/** @borrows deleteAllBlocks as this.deleteAllBlocks */
	deleteAllBlocks = deleteAllBlocks.bind( this );
	/** @borrows createPost as this.createPost */
	createPost: typeof createPost = createPost.bind( this );
	/** @borrows deleteAllPosts as this.deleteAllPosts */
	deleteAllPosts: typeof deleteAllPosts = deleteAllPosts.bind( this );
	/** @borrows createClassicMenu as this.createClassicMenu */
	createClassicMenu: typeof createClassicMenu =
		createClassicMenu.bind( this );
	/** @borrows createNavigationMenu as this.createNavigationMenu */
	createNavigationMenu: typeof createNavigationMenu =
		createNavigationMenu.bind( this );
	/** @borrows deleteAllMenus as this.deleteAllMenus */
	deleteAllMenus: typeof deleteAllMenus = deleteAllMenus.bind( this );
	/** @borrows getNavigationMenus as this.getNavigationMenus */
	getNavigationMenus: typeof getNavigationMenus =
		getNavigationMenus.bind( this );
	/** @borrows createComment as this.createComment */
	createComment: typeof createComment = createComment.bind( this );
	/** @borrows deleteAllComments as this.deleteAllComments */
	deleteAllComments: typeof deleteAllComments =
		deleteAllComments.bind( this );
	/** @borrows deleteAllWidgets as this.deleteAllWidgets */
	deleteAllWidgets: typeof deleteAllWidgets = deleteAllWidgets.bind( this );
	/** @borrows addWidgetBlock as this.addWidgetBlock */
	addWidgetBlock: typeof addWidgetBlock = addWidgetBlock.bind( this );
	/** @borrows deleteAllTemplates as this.deleteAllTemplates */
	deleteAllTemplates: typeof deleteAllTemplates =
		deleteAllTemplates.bind( this );
	/** @borrows createTemplate as this.createTemplate */
	createTemplate: typeof createTemplate = createTemplate.bind( this );
	/** @borrows resetPreferences as this.resetPreferences */
	resetPreferences: typeof resetPreferences = resetPreferences.bind( this );
	/** @borrows listMedia as this.listMedia */
	listMedia: typeof listMedia = listMedia.bind( this );
	/** @borrows uploadMedia as this.uploadMedia */
	uploadMedia: typeof uploadMedia = uploadMedia.bind( this );
	/** @borrows deleteMedia as this.deleteMedia */
	deleteMedia: typeof deleteMedia = deleteMedia.bind( this );
	/** @borrows deleteAllMedia as this.deleteAllMedia */
	deleteAllMedia: typeof deleteAllMedia = deleteAllMedia.bind( this );
	/** @borrows createUser as this.createUser */
	createUser: typeof createUser = createUser.bind( this );
	/** @borrows deleteAllUsers as this.deleteAllUsers */
	deleteAllUsers: typeof deleteAllUsers = deleteAllUsers.bind( this );
	/** @borrows getSiteSettings as this.getSiteSettings */
	getSiteSettings: typeof getSiteSettings = getSiteSettings.bind( this );
	/** @borrows updateSiteSettings as this.updateSiteSettings */
	updateSiteSettings: typeof updateSiteSettings =
		updateSiteSettings.bind( this );
	/** @borrows deleteAllPages as this.deleteAllPages */
	deleteAllPages: typeof deleteAllPages = deleteAllPages.bind( this );
	/** @borrows createPage as this.createPage */
	createPage: typeof createPage = createPage.bind( this );
	/** @borrows getCurrentThemeGlobalStylesPostId as this.getCurrentThemeGlobalStylesPostId */
	getCurrentThemeGlobalStylesPostId: typeof getCurrentThemeGlobalStylesPostId =
		getCurrentThemeGlobalStylesPostId.bind( this );
	/** @borrows getThemeGlobalStylesRevisions as this.getThemeGlobalStylesRevisions */
	getThemeGlobalStylesRevisions: typeof getThemeGlobalStylesRevisions =
		getThemeGlobalStylesRevisions.bind( this );
	/** @borrows updateGlobalStyles as this.updateGlobalStyles */
	updateGlobalStyles: typeof updateGlobalStyles =
		updateGlobalStyles.bind( this );
	/** @borrows deleteAllPatternCategories as this.deleteAllPatternCategories */
	deleteAllPatternCategories = deleteAllPatternCategories.bind( this );
	/** @borrows setGutenbergExperiments as this.setGutenbergExperiments */
	setGutenbergExperiments: typeof setGutenbergExperiments =
		setGutenbergExperiments.bind( this );
}

export type { StorageState };
export { RequestUtils };
