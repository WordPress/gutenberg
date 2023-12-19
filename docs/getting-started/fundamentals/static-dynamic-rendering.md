# Static or Dynamic rendering of a block



A block can define dynamic rendering can be defined in two ways:
    - The `register_block_type()` function includes a `render_callback` argument.
    - A `render` property is added to `block.json`, whose value points to a separate PHP file (usually named `render.php`).

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