# Static or Dynamic rendering of a block

A block can have 
- **Blocks with static rendering** - Blocks with no dynamic rendering method defined (or available) for the block. In this case, the output for the front end will be taken from the markup representation of the block in the database.
    - A block will also have static rendering when there was originally a dynamic rendering method defined for the block, but that method is no longer available due to the uninstallation of the plugin that registered the block. If no dynamic rendering method is found, any markup representation of the block in the database will be returned to the front end.
- **Blocks with dynamic rendering** - Blocks with dynamic rendering method defined (or available) for the block. In this case, the output for the front end will be processed in the server when there's a request from the client.
    - This dynamic rendering process may take into account the markup representation of the block in the database, the attributes of the block, and any other data that is available from the server.

By default a block will use its representation in the DB as output to be delivered to the front end, unless it has dynamic rendering. If the block has some form of dynamic rendering defined and available, that logic will determine the output of the block for the front end.

A block can define dynamic rendering in two ways:
    1. Via the `render_callback` argument that can be passed to the `register_block_type()` function.
    2. Via a separate PHP file (usually named `render.php`) which path can be defined at the `render` propertyof the `block.json`.

Blocks can have static or dynamic rendering:
- If no dynamic rendering has been been defined the rendering 

## Blocks with Static Rendering 

Blocks with static rendering **generate the HMTL for the frontend at "update-time" (when it's saved)**:
- Blocks with static render use their markup representation in the DB to return the markup used in the frontend for the block
- The `save()` function writes the block’s markup inside the block indicators (HTML comments). 
- Only the markup inside the block indicators is returned as markup to be rendered for the block in the frontend.
- For blocks with static render, the markup returned to the frontend is defined/set when the page is saved.

## Blocks with Dynamic Rendering 

Blocks with dynamic rendering **generate the HMTL for the frontend at "request-time" (when it's requested)**
- These blocks usually need to display info that is not known at the time the page is saved
- Dynamic rendering for a block can be defined:
    - The `register_block_type()` function includes a `render_callback` argument.
    - A `render` property is added to `block.json`, whose value points to a separate PHP file (usually named `render.php`).
- Dynamic render methods receive attribute, inner content information and   additional required dynamic site information.