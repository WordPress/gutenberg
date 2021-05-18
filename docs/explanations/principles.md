# Gutenberg Principles

This document has been written so that those contributing to the Gutenberg project can have some understanding of what guides decisions around what is included in the project (or not).

An important thing to keep at top of mind when reviewing these principles is that they are not isolated from each other. There is a cohesiveness and complementary nature between them that results in a synergistic impact and direction.

When applied, sometimes these principles build on each other much like the idea of constructing a house with a foundation, walls and roof. However, other times the application of the principles results in something that is more similar to a tapestry where threads of each principle are embedded together and evident in the finished feature or design of the project.


## A canvas for expression.

_“Optimize for the user” (Matías - [Gutenberg or the Ship of Theseus](https://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/))_

The block canvas is the primary interface and brings about the expectation of *direct* manipulation. Blocks can define multiple states, variations, and can mutate. The canvas of the block should:

### Guide users around interacting with the content.

For this, the interface needs to welcome exploration and to be able to teach its affordances intuitively. It should result in experiences producing empowering "aha!" moments when users interact with it (see [here for an example](https://twitter.com/colemank83/status/1371846826664591364)).

Interactive tools should be contextual when needed, and focus on supporting the user in creating their content - present when needed and getting out of the way when not.

### Uniformity within diversity

Learning the ingredients of the interface happens once, but scales to hundreds of blocks. Users should be able to *rely on muscle memory and learned patterns* as they become more familiar with the interface.

### Accessible

Being accessible is a holistic principle that embraces not only the desire that _everyone can work with Gutenberg interfaces no matter their ability_ but also that the improvements made are _equitable_ and improve the experience for _every_ user. This is a lofty challenge and definitely hard balance to get right - but already there is fruit being born in the improvements that have been made to the user interface over the last few years.

Modern web application development brings its own set of accessibility problems around standards and consistent application between browsers which often requires some unique solutions that might not be apparent on the first attempt. So we acknowledge that accessibility is not something that can be implemented statically but instead is an ongoing part of the interface creation and refinement.

## Curated Extensibility

The use of the word _curated_ expressly refers to implementing extensibility in a way that prioritizes those _using Gutenberg interfaces to create their content_ over developers integrating with the system. As a result, every extensibility interface request is filtered through the question of how it impacts creator workflows.

Implementation details are ephemeral. Practically this means that the traditional WP approach of wrapping things in filters and liberal use of actions is avoided in favor of explicit extension interfaces that expose _functionality_ but hide the _implementation details._ Gutenberg has opinionated APIs that favor stability and functionality for the user over flexibility for the developer.

Extensibility interfaces in Gutenberg favor:

**Modularity** - the concept of being able to combine blocks or components into different types of layout or content (see “[Embrace the modularity](https://riad.blog/2020/01/28/embrace-the-modularity/)”).

**Encapsulation** - there are appropriate error handling and boundaries around things that could be broken by things extending the interface.

**Experimentation** - Often new APIs and interfaces clearly start as experimental while reliability and usability of different approaches are being tested. These experiments always begin with determining what problem is solved from the _creator_ perspective and seek to validate how it impacts the user workflow. The intent is to explore what generalizations of the creator's use-case are possible and to discover better abstractions before solidifying around the contract exposed to extension developers.


## Progressive Complexity

_“On the Layers of the Onion”_ (Matías - [Gutenberg or the Ship of Theseus](https://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/))

There are two perspectives for this principle:

As it applies to **developers** (plugin or theme), progressive complexity means that there are degrees of ability and understanding needed in order to extend or contribute to Gutenberg. This has overlap with the _curated extensibility_ principle where some interfaces have clearly defined (opinionated) registration APIs that hide much of the complexity in the lower layers that implement the things registered.

As an example of this continuum, the complexity needed for building and distributing blocks or building and distributing themes should be minimal. As you get closer to working within Gutenberg internals directly, it does require more understanding of various technologies and technical stacks to be effective in this area.

The other perspective is that of the **creator** of content using Gutenberg where the UI/UX should present very simple “keep out of my way” interactions until more complex requirements are needed which are “revealed” when and as needed.

An example here would be creators discovering they can move a block into another block in various contexts and discovering it _just works_. So even learning basic interactions can help _empower_ more complex interactions through the delight of experimenting as a natural outflow of the creative process. A great example of this is the power of multi-block transforms.

There’s also the related application here to design systems in larger organizations where the design team wants to put some restrictions on what can be modified and manipulated by the content creation team in keeping with the chosen designs behind the presentation of that content. In this case, the progressive complexity principle in Gutenberg provides the tools for “locking down” various elements of the editor when and as needed depending on who is working with the content. Entire swaths of the interface could be hidden or removed to account for the fluent needs of those interacting with the content.


## Ubiquitous and Safe Adoption

This encompasses the idea of _backwards compatibility_ and _graceful degradation_.

“One’s existing content should never be lost or generally affected by the switch to a new editor. The newer tool should understand the content natively or at the very least leave it undisturbed.” (Backwards compatibility principle in “[The Language of Gutenberg](https://lamda.blog/2018/04/22/the-language-of-gutenberg/)” - Miguel)

This also encompasses the ideas of _portability and freedom from lock-in_:

“One’s content shouldn’t be tied to anything. This means that content shouldn’t be tied to any runtime, be it Gutenberg or WordPress in general, and that a good relationship with other editors (mobile apps, MarsEdit, etc.) should be developed.” (Portability principle in “The Language of Gutenberg - Miguel)

“Adopting Gutenberg for early testing or curiosity shouldn’t be an irreversible action for one’s content. Disabling Gutenberg shouldn’t result in unreasonably altered content. The same should later apply to third-party blocks. There is a strong desire to fight lock-in, which is not new but is pervasive in a world of proprietary software and software-as-a-service.” (No commitment principle in “The language of Gutenberg - Miguel)

This also embraces the promise of the Web where content is replicable in multiple ways across devices and apps. It’s the idea that the basic block structure proves to be a timeless and reliable way of representing the content and meta information about that content.

Imagine a world where content created by Gutenberg can be consumed and read _anywhere_. This is largely why at the heart of the block structure, the format is largely an enhancement on top of HTML.

“Ultimately, choosing HTML means that — as with a painting or a sculpture — the editor’s final artefact is the canonical format of the content, not a byproduct thereof.” (The Language of Gutenberg](https://lamda.blog/2018/04/22/the-language-of-gutenberg/) - Miguel).

This manifests in letting machines do what machines are good for, and preserve content in a format that is readable to users.

Finally, the principle of ubiquitous and safe adoption is found in the way Gutenberg is being developed _incrementally_. WordPress powers over 40% of the Web and the changes that GB brings cannot happen overnight (Matías - [Gutenberg or the Ship of Theseus](https://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/))


## Resources

*   [Gutenberg or the ship of Theseus](https://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/) (Matías Ventura Bausero)
*   [The Language of Gutenberg](https://lamda.blog/2018/04/22/the-language-of-gutenberg/) (Miguel Fonseca)
*   [Embrace the Modularity](https://riad.blog/2020/01/28/embrace-the-modularity/) (Riad Benguella)
*   [Gutenberg Posts Aren’t HTML](https://fluffyandflakey.blog/2017/09/04/gutenberg-posts-arent-html/) (Dennis Snell)
*   [We called it Gutenberg for a Reason](https://ma.tt/2017/08/we-called-it-gutenberg-for-a-reason/) (Matt Mullenweg)
