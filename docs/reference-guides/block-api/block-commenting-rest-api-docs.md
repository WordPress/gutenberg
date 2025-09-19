# Block Commenting REST API

The Block Commenting feature in WordPress 6.9 allows users to add comments directly to individual blocks in the Gutenberg editor, creating a collaborative editing experience with threaded discussions.

## Overview

Block comments are a special type of WordPress comments that are associated with specific blocks in the editor. They use the custom comment type `block_comment` and support full CRUD operations through the WordPress REST API.

### Key Features

- **Custom Comment Type**: Uses `block_comment` type to distinguish from regular post comments
- **Threaded Discussions**: Support for parent-child comment relationships
- **Status Management**: Comments can be resolved (`approved`) or reopened (`hold`)
- **Block Association**: Comments are linked to specific blocks via `blockCommentId` attribute
- **Permission Handling**: Follows WordPress comment permission system

## Base URL

All endpoints are relative to your WordPress site's REST API base URL:

```
https://yoursite.com/wp-json/wp/v2/
```

## Endpoints

### List Block Comments

Retrieve a collection of block comments.

**Endpoint:** `GET /wp/v2/comments`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `post` | integer | Limit result set to comments assigned to specific post IDs. | - |
| `comment_type` | string | Limit result set to comments assigned a specific type. Use `block_comment` for block comments. | - |
| `parent` | integer | Limit result set to comments assigned to specific parent comment IDs. | - |
| `search` | string | Limit results to those matching a string. | - |
| `status` | string | Limit result set to comments assigned a specific status. | - |
| `include` | array | Limit result set to specific comment IDs. | - |
| `exclude` | array | Ensure result set excludes specific comment IDs. | - |
| `offset` | integer | Offset the result set by a specific number of items. | 0 |
| `order` | string | Order sort attribute ascending or descending. | `desc` |
| `orderby` | string | Sort collection by comment attribute. | `date_gmt` |
| `per_page` | integer | Maximum number of items to be returned in result set. | 10 |
| `page` | integer | Current page of the collection. | 1 |

**Example Request:**

```bash
curl -X GET "https://yoursite.com/wp-json/wp/v2/comments?comment_type=block_comment&post=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
[
  {
    "id": 456,
    "post": 123,
    "parent": 0,
    "author": 1,
    "author_name": "John Doe",
    "author_url": "",
    "date": "2024-01-15T10:30:00",
    "date_gmt": "2024-01-15T15:30:00",
    "content": {
      "rendered": "<p>This is a block comment</p>",
      "raw": "This is a block comment"
    },
    "link": "https://yoursite.com/?p=123#comment-456",
    "status": "hold",
    "type": "block_comment",
    "meta": [],
    "author_avatar_urls": {
      "24": "https://secure.gravatar.com/avatar/...",
      "48": "https://secure.gravatar.com/avatar/...",
      "96": "https://secure.gravatar.com/avatar/..."
    }
  }
]
```

### Create Block Comment

Create a new block comment.

**Endpoint:** `POST /wp/v2/comments`

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post` | integer | Yes | The ID of the associated post. |
| `content` | string | Yes | The content for the comment. |
| `comment_type` | string | Yes | Must be set to `block_comment`. |
| `comment_approved` | integer | No | Comment approval status. Default: `0` (hold). |
| `parent` | integer | No | The ID of the parent comment (for replies). |
| `author_name` | string | No | The comment author's name (for non-logged-in users). |
| `author_email` | string | No | The comment author's email (for non-logged-in users). |
| `author_url` | string | No | The comment author's URL (for non-logged-in users). |

**Example Request:**

```bash
curl -X POST "https://yoursite.com/wp-json/wp/v2/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post": 123,
    "content": "This is a new block comment",
    "comment_type": "block_comment",
    "comment_approved": 0
  }'
```

**Example Response:**

```json
{
  "id": 456,
  "post": 123,
  "parent": 0,
  "author": 1,
  "author_name": "John Doe",
  "author_url": "",
  "date": "2024-01-15T10:30:00",
  "date_gmt": "2024-01-15T15:30:00",
  "content": {
    "rendered": "<p>This is a new block comment</p>",
    "raw": "This is a new block comment"
  },
  "link": "https://yoursite.com/?p=123#comment-456",
  "status": "hold",
  "type": "block_comment",
  "meta": [],
  "author_avatar_urls": {
    "24": "https://secure.gravatar.com/avatar/...",
    "48": "https://secure.gravatar.com/avatar/...",
    "96": "https://secure.gravatar.com/avatar/..."
  }
}
```

### Retrieve Block Comment

Get a specific block comment by ID.

**Endpoint:** `GET /wp/v2/comments/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Unique identifier for the comment. |

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `context` | string | Scope under which the request is made; determines fields present in response. | `view` |
| `password` | string | The password for the parent post of the comment (if the post is password protected). | - |

**Example Request:**

```bash
curl -X GET "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "id": 456,
  "post": 123,
  "parent": 0,
  "author": 1,
  "author_name": "John Doe",
  "author_url": "",
  "date": "2024-01-15T10:30:00",
  "date_gmt": "2024-01-15T15:30:00",
  "content": {
    "rendered": "<p>This is a block comment</p>",
    "raw": "This is a block comment"
  },
  "link": "https://yoursite.com/?p=123#comment-456",
  "status": "hold",
  "type": "block_comment",
  "meta": [],
  "author_avatar_urls": {
    "24": "https://secure.gravatar.com/avatar/...",
    "48": "https://secure.gravatar.com/avatar/...",
    "96": "https://secure.gravatar.com/avatar/..."
  }
}
```

### Update Block Comment

Update an existing block comment.

**Endpoint:** `PUT /wp/v2/comments/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Unique identifier for the comment. |

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | No | The content for the comment. |
| `status` | string | No | Comment status. Values: `hold`, `approved`, `spam`, `trash`. |
| `parent` | integer | No | The ID of the parent comment (for replies). |

**Example Request (Update Content):**

```bash
curl -X PUT "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated block comment content"
  }'
```

**Example Request (Resolve Comment):**

```bash
curl -X PUT "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**Example Request (Reopen Comment):**

```bash
curl -X PUT "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "hold"
  }'
```

**Example Response:**

```json
{
  "id": 456,
  "post": 123,
  "parent": 0,
  "author": 1,
  "author_name": "John Doe",
  "author_url": "",
  "date": "2024-01-15T10:30:00",
  "date_gmt": "2024-01-15T15:30:00",
  "content": {
    "rendered": "<p>Updated block comment content</p>",
    "raw": "Updated block comment content"
  },
  "link": "https://yoursite.com/?p=123#comment-456",
  "status": "approved",
  "type": "block_comment",
  "meta": [],
  "author_avatar_urls": {
    "24": "https://secure.gravatar.com/avatar/...",
    "48": "https://secure.gravatar.com/avatar/...",
    "96": "https://secure.gravatar.com/avatar/..."
  }
}
```

### Delete Block Comment

Delete a block comment.

**Endpoint:** `DELETE /wp/v2/comments/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Unique identifier for the comment. |

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `force` | boolean | Whether to bypass Trash and force deletion. | `false` |
| `password` | string | The password for the parent post of the comment (if the post is password protected). | - |

**Example Request:**

```bash
curl -X DELETE "https://yoursite.com/wp-json/wp/v2/comments/456?force=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "deleted": true,
  "previous": {
    "id": 456,
    "post": 123,
    "parent": 0,
    "author": 1,
    "author_name": "John Doe",
    "author_url": "",
    "date": "2024-01-15T10:30:00",
    "date_gmt": "2024-01-15T15:30:00",
    "content": {
      "rendered": "<p>This is a block comment</p>",
      "raw": "This is a block comment"
    },
    "link": "https://yoursite.com/?p=123#comment-456",
    "status": "hold",
    "type": "block_comment",
    "meta": [],
    "author_avatar_urls": {
      "24": "https://secure.gravatar.com/avatar/...",
      "48": "https://secure.gravatar.com/avatar/...",
      "96": "https://secure.gravatar.com/avatar/..."
    }
  }
}
```

## Comment Threading

Block comments support threaded discussions through the `parent` parameter:

- **Top-level comments**: Set `parent` to `0` or omit the parameter
- **Replies**: Set `parent` to the ID of the comment you're replying to

### Example: Creating a Reply

```bash
curl -X POST "https://yoursite.com/wp-json/wp/v2/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post": 123,
    "content": "This is a reply to the block comment",
    "comment_type": "block_comment",
    "comment_approved": 0,
    "parent": 456
  }'
```

## Status Management

Block comments support the following status values:

| Status | Description | Numeric Value |
|--------|-------------|---------------|
| `hold` | Comment is pending moderation | `0` |
| `approved` | Comment is approved/resolved | `1` |
| `spam` | Comment is marked as spam | `spam` |
| `trash` | Comment is in trash | `trash` |

### Common Status Operations

**Resolve a comment (mark as approved):**
```bash
curl -X PUT "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Reopen a resolved comment:**
```bash
curl -X PUT "https://yoursite.com/wp-json/wp/v2/comments/456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "hold"}'
```

## Permission Handling

Block comments follow WordPress's standard comment permission system:

### Required Capabilities

| Action | Required Capability |
|--------|-------------------|
| Create | `edit_posts` (for logged-in users) or none (for public comments) |
| Read | `moderate_comments` (for private comments) or none (for public comments) |
| Update | `edit_comment` or `moderate_comments` |
| Delete | `delete_comment` or `moderate_comments` |

### Authentication

- **Logged-in users**: Use WordPress authentication (cookies, application passwords, or OAuth)
- **Public comments**: No authentication required (if comments are open)

**Example with Application Password:**

```bash
curl -X GET "https://yoursite.com/wp-json/wp/v2/comments?comment_type=block_comment" \
  -u "username:application_password"
```

## Error Handling

The API returns standard HTTP status codes and WordPress error responses:

### Common Error Responses

**400 Bad Request:**
```json
{
  "code": "rest_comment_invalid_post",
  "message": "Invalid post ID.",
  "data": {
    "status": 400
  }
}
```

**401 Unauthorized:**
```json
{
  "code": "rest_cannot_create",
  "message": "Sorry, you are not allowed to create comments as this user.",
  "data": {
    "status": 401
  }
}
```

**403 Forbidden:**
```json
{
  "code": "rest_cannot_edit",
  "message": "Sorry, you are not allowed to edit this comment.",
  "data": {
    "status": 403
  }
}
```

**404 Not Found:**
```json
{
  "code": "rest_comment_invalid_id",
  "message": "Invalid comment ID.",
  "data": {
    "status": 404
  }
}
```

## Integration with Gutenberg

Block comments are designed to work seamlessly with the Gutenberg editor:

1. **Block Association**: Comments are linked to blocks via the `blockCommentId` attribute
2. **Real-time Updates**: The editor automatically refreshes when comments are modified
3. **Visual Indicators**: Comments are highlighted in the editor when selected
4. **Sidebar Integration**: Comments appear in the collaborative sidebar panel

## Best Practices

1. **Always specify `comment_type`**: Set to `block_comment` for all block comment operations
2. **Handle threading properly**: Use the `parent` parameter to create reply threads
3. **Implement proper error handling**: Check for HTTP status codes and error messages
4. **Use appropriate permissions**: Ensure users have the correct capabilities for their actions
5. **Cache comment data**: Consider caching comment data for better performance
6. **Validate input**: Sanitize and validate all comment content before submission

## Related Resources

- [WordPress REST API Comments Reference](https://developer.wordpress.org/rest-api/reference/comments/)
- [WordPress Comment Functions](https://developer.wordpress.org/reference/functions/wp_insert_comment/)
- [Gutenberg Block Editor](https://developer.wordpress.org/block-editor/)
- [WordPress Capabilities](https://developer.wordpress.org/plugins/users/roles-and-capabilities/)

---

*This documentation is for WordPress 6.9 and the Block Commenting feature. For the latest updates, refer to the [WordPress Developer Documentation](https://developer.wordpress.org/).*
