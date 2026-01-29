# Repository Management

This is a living document explaining how we collaboratively manage the Gutenberg repository. If you’d like to suggest a change, please open an issue for discussion or submit a pull request to the document.

This document covers:

-   [Issues](#issues)
    -   [Labels](#labels)
    -   [Milestones](#milestones)
    -   [Triaging Issues](#triaging-issues)
-   [Pull Requests](#pull-requests)
    -   [Code Review](#code-review)
    -   [Design Review](#design-review)
    -   [Merging Pull Requests](#merging-pull-requests)
    -   [Closing Pull Requests](#closing-pull-requests)
    -   [How To Get Your Pull Request Reviewed?](/docs/contributors/code/how-to-get-your-pull-request-reviewed.md)
-   [Projects](#projects)

## Issues

A healthy issue list is one where issues are relevant and actionable. _Relevant_ in the sense that they relate to the project’s current priorities. _Actionable_ in the sense that it’s clear what action(s) need to be taken to resolve the issue.

Any issues that are irrelevant or not actionable should be closed, because they get in the way of making progress on the project. Imagine the issue list as a desk: the more clutter you have on it, the more difficult it is to use the space to get work done.

### Labels

All issues should have [one or more labels](https://github.com/WordPress/gutenberg/labels).

Workflow labels start with “Needs” and may be applied as needed. Ideally, each workflow label will have a group that follows it, such as the Accessibility Team for `Needs Accessibility Feedback`, the Testing Team for `Needs Testing`, etc.

[Priority High](https://github.com/WordPress/gutenberg/labels/%5BPriority%5D%20High) and [Priority OMGWTFBBQ](https://github.com/WordPress/gutenberg/labels/%5BPriority%5D%20OMGWTFBBQ) issues should have an assignee and/or be in an active milestone.

Help requests or 'how to' questions should be posted in a relevant support forum as a first step. If something might be a bug but it's not clear, the Support Team or a forum volunteer can help troubleshoot the case to help get all the right information needed for an effective bug report.

Here are some labels you might commonly see:

-   [Good First Issue](https://github.com/WordPress/gutenberg/labels/Good%20First%20Issue) - Issues identified as good for new contributors to work on. Comment to note that you intend to work on the issue and reference the issue number in the pull request you submit.
-   [Good First Review](https://github.com/WordPress/gutenberg/labels/Good%20First%20Review) - Pull requests identified as good for new contributors who are interested in doing code reviews.
-   [Needs Accessibility Feedback](https://github.com/WordPress/gutenberg/labels/Needs%20Accessibility%20Feedback) - Changes that impact accessibility and need corresponding review (e.g. markup changes).
-   [Needs Design Feedback](https://github.com/WordPress/gutenberg/labels/Needs%20Design%20Feedback) - Changes that modify the design or user experience in some way and need sign-off.
-   [[Type] Bug](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Bug) - An existing feature is broken in some way.
-   [[Type] Enhancement](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Enhancement) - Gutenberg would be better with this improvement added.
-   [[Type] Plugin Interoperability](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Plugin%20Interoperability) - Documentation of a conflict between Gutenberg and a plugin or extension. The plugin author should be informed and provided documentation on how to address.
-   [[Status] Needs More Info](https://github.com/WordPress/gutenberg/labels/%5BStatus%5D%20Needs%20More%20Info) - The issue needs more information in order to be actionable and relevant. Typically this requires follow-up from the original reporter.

[Check out the label directory](https://github.com/WordPress/gutenberg/labels) for a listing of all labels.

### Milestones

We put issues into [milestones](https://github.com/wordpress/gutenberg/milestones) to better categorize them. Issues are added to milestones starting with `WordPress` and pull requests are added to milestones ending in `(Gutenberg)`.

Here are some milestones you might see:

-   [WordPress X.Y](https://github.com/WordPress/gutenberg/milestone/70): Tasks that should be done for future WordPress releases.
-   [X.Y (Gutenberg)](https://github.com/WordPress/gutenberg/milestone/85): PRs targeted for the Gutenberg Plugin X.Y release.
-   [Future](https://github.com/WordPress/gutenberg/milestone/35): this is something that is confirmed by everyone as a good thing but doesn’t fall into other criteria.

### Triaging issues

To keep the issue list healthy, it needs to be triaged regularly. _Triage_ is the practice of reviewing existing issues to make sure they’re relevant, actionable, and have all the information they need.

Anyone can help triage, although you’ll need contributor permission on the Gutenberg repository to modify an issue’s labels or edit its title.

See the [Triage Contributors guide](/docs/contributors/triage.md) for details.

## Pull requests

Gutenberg follows a feature branch pull request workflow for all code and documentation changes. At a high-level, the process looks like this:

1. Check out a new feature branch locally.
2. Make your changes, testing thoroughly.
3. Commit your changes when you’re happy with them, and push the branch.
4. Open your pull request.
5. If you are a regular contributor with proper access, label and name your pull request appropriately (see below).

For labeling and naming pull requests, here are guidelines to consider that make compiling the changelog more efficient and organized. These guidelines are particularly relevant for regular contributors. Don't let getting the following right be a blocker for sharing your work - mistakes are expected and easy to fix!

-   When working on experimental screens and features, apply the `[Type] Experimental` label instead of `Feature`, `Enhancement`, etc.
-   When working on new features to technical packages (scripts, create-block, adding react hooks, etc), apply the `[Type] New API` label instead of `Feature`, `Enhancement`, etc.
-   When fixing a bug or making an enhancement to an internal tool used in the project, apply the `[Type] Build Tooling` instead of `Bugs`, `Enhancement`, etc
-   In pull request titles, instead of describing the code change done to fix an issue, consider referring to the actual bug being fixed instead. For example: instead of saying "Check for nullable object in component", it would be preferable to say "Fix editor breakage when clicking the copy block button".

Along with this process, there are a few important points to mention:

-   Non-trivial pull requests should be preceded by a related issue that defines the problem to solve and allows for discussion of the most appropriate solution before actually writing code.
-   To make it far easier to merge your code, each pull request should only contain one conceptual change. Keeping contributions atomic keeps the pull request discussion focused on one topic and makes it possible to approve changes on a case-by-case basis.
-   Separate pull requests can address different items or todos from their linked issue, there’s no need for a single pull request to cover a single issue if the issue is non-trivial.

### Code review

Every pull request goes through a manual code review, in addition to automated tests. The objectives for the code review are best thought of as:

-   Correct — Does the change do what it’s supposed to?
-   Secure — Would a nefarious party find some way to exploit this change?
-   Readable — Will your future self be able to understand this change months down the road?
-   Elegant — Does the change fit aesthetically within the overall style and architecture?
-   Altruistic — How does this change contribute to the greater whole?

_As a reviewer_, your feedback should be focused on the idea, not the person. Seek to understand, be respectful, and focus on constructive dialog.

_As a contributor_, your responsibility is to learn from suggestions and iterate your pull request should it be needed based on feedback. Seek to collaborate and produce the best possible contribution to the greater whole.

Code reviews are encouraged by everyone who is willing to attempt one. If you review a pull request and are confident in the changes, approve it. If you don't feel totally confident it is ready for merging, add your review with a comment that says it should have another set of eyes on it before final approval. This can help filter out obvious bugs and simplify reviews for core members. Following the later reviews will also help improve your reviewing confidence in the future.

If you are not yet comfortable leaving a full review, try commenting on a PR. Questions about functionality or the reasoning behind a change are helpful too. You could also comment on changes to parts of the code you understand, without leaving a full review.

If you struggle with getting a review, see: [How To Get Your Pull Request Reviewed?](/docs/contributors/code/how-to-get-your-pull-request-reviewed.md)

### Design review

If your pull request impacts the design/UI, you need to label appropriately to alert design. To request a design review, add the [Needs Design Feedback](https://github.com/WordPress/gutenberg/labels/Needs%20Design%20Feedback) label to your PR. If there are any PRs that require an update to the design/UI, please use the [Figma Library Update](https://github.com/WordPress/gutenberg/labels/Figma%20Library%20Update) label.

As a guide, changes that should be reviewed:

-   A change based on a previous design, to confirm the design is still valid with the change.
-   Anything that changes something visually.
-   If you just want design feedback on an idea or exploration.

### Merging pull requests

A pull request can generally be merged once it is:

-   Deemed a worthwhile change to the codebase.
-   In compliance with all relevant code review criteria.
-   Covered by sufficient tests, as necessary.
-   Vetted against all potential edge cases.
-   Changelog entries were properly added.
-   Reviewed by someone other than the original author.
-   [Rebased](/docs/contributors/code/git-workflow.md#keeping-your-branch-up-to-date) onto the latest version of the `trunk` branch.

The final pull request merge decision is made by the **@wordpress/gutenberg-core** team.

All members of the WordPress organization on GitHub have the ability to review and merge pull requests. If you have reviewed a PR and are confident in the code, approve the pull request and comment pinging **@wordpress/gutenberg-core** or a specific core member who has been involved in the PR. Once they confirm there are no objections, you are free to merge the PR into trunk.

Most pull requests will be automatically assigned a release milestone, but please make sure your merged pull request was assigned one. Doing so creates the historical legacy of what code landed when, and makes it possible for all project contributors (even non-technical ones) to access this information.

### Closing pull requests

Sometimes, a pull request may not be mergeable, no matter how much additional effort is applied to it (e.g. out of scope). In these cases, it’s best to communicate with the contributor graciously while describing why the pull request was closed, this encourages productive future involvement.

Make sure to:

1. Thank the contributor for their time and effort.
2. Fully explain the reasoning behind the decision to close the pull request.
3. Link to as much supporting documentation as possible.

If you’d like a template to follow:

> Thanks \_\_\_\_ for the time you’ve spent on this pull request.
>
> I’m closing this pull request because \_\_\_\_. To clarify further, \_\_\_\_.
>
> For more details, please see \_\_\_\_ and \_\_\_\_.

## Teams

Two GitHub teams are used in the project.

-   [Gutenberg Core](https://github.com/orgs/WordPress/teams/gutenberg-core): A team composed of people that are actively involved in the project: attending meetings regularly, participating in triage sessions, performing reviews regularly, working on features and bug fixes and performing plugin and npm releases.

-   [Gutenberg](https://github.com/orgs/WordPress/teams/gutenberg): A team composed of contributors with at least 2–3 meaningful contributions to the project.

If you meet this criterion of several meaningful contributions having been accepted into the repository and would like to be added to the Gutenberg team, feel free to ask in the [#core-editor Slack channel](https://make.wordpress.org/chat/).

## Projects

We use [GitHub projects](https://github.com/WordPress/gutenberg/projects) to keep track of details that aren't immediately actionable, but that we want to keep around for future reference.
