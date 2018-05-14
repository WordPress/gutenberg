# Gutenbergのデザイン原則とビジョン

この随時更新される文書は、エディター画面を設計する際に役立つデザイン原則とパターンのいくつかを記述するのに役立ちます。目的は、デザインの背景を説明し、将来の改善についての周知を助けることです。

![Block](https://cldup.com/7HCnN5cFc0.png)

この文書では、どのように _適切なブロック_ をデザインするべきかということも検討していきます。

## Gutenbergのゴール

Gutenberg の包括的な目標は、 _リッチな投稿レイアウト_ を簡単に作成できる投稿とページを構築する経験を作り出すことです。[キックオフポスト](https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/)より:

> エディターは、新しいページやポストを簡単に作成し構築する経験を実現するために懸命に努力します。そのために、今日の時点では、ショートコード、カスタム HTML 、または「ミステリー・ミート」埋め込みの検出を容易にするためのブロックがあります。

これから以下の事が言えます:

- リッチな投稿の作成は WordPress の強みのカギです。
- ブロックの概念は、一つの傘の下に複数の異なるインターフェースを統一することを目指しています。オブジェクトを埋め込むためにショートコードやカスタム HTML を書いたり、URL を貼り付ける必要はないのです。ブロックの仕組みを覚えるだけで、全てのやり方が分かるようになるべきです。
- 「ミステリー・ミート」とは、ソフトウェアの隠された機能を示します。それはあなたが発見しなくてはなりません。 WordPress は既に大量のブロックと30以上の埋め込みをサポートしているので、人々が既にある機能を見つけられずにプラグインをインストールしないで済むように、その視認性を高めましょう。

## なぜか

WordPress を他のシステムと区別できることの一つとして、自分で想像できるようにリッチな投稿レイアウトを作成できるということがあります -- しかしそれは HTML と CSS を理解し自分のカスタムテーマを構築出来る場合にのみ可能です。リッチな投稿を書けるツールとしてエディターを捉えることによって、数回クリックするだけで美しいレイアウトを作成できるなら、うまくいけば、人々はワンクリックでインストールできるから選ぶだけでなく、 WordPress がコンテンツのために出来ることについて愛してくれるようなるでしょう。

## ビジョン

**全てをブロックにする**。 文章、画像、ギャラリー、ウィジェット、ショートコード、そしてカスタム HTML の塊さえも、たとえプラグインや他の方法によって追加されていたとしても、単一のインターフェイス（ブロックインターフェイス）を習得するだけで、すべての操作方法を知ることができます。

**全てのブロックを均等に作成する**。すべては同じ挿入インターフェースの中にあります。最近の投稿、検索、タブ、およびグループ化を使用して、最も多く使用するブロックを簡単に使えるようにします。

**ドラックアンドドロップが追加できる**。明示的なアクション（クリックまたはタブやスペース）が存在する場合にのみ、ドラッグアンドドロップを追加エンハンスメントとしてその上に追加できます。

**プレースホルダーはカギである**。ブロックが中立のプレースホルダー状態を持つことができるなら、そうすべきです。画像のプレースホルダーブロックにはメディアライブラリを開くボタンが表示され、テキストのプレースホルダーブロックには書き込みプロンプトが表示されます。プレースホルダーを使用することで編集可能なレイアウトを事前に定義することができるので、あとは _空白を埋める_ だけでよいのです。

**直接操作**。私たちが構築しているブロック技術は、ページ上で直接コンテンツを操作するユーザーエクスペリエンスを最適化します。プラグインとテーマ作成者は、ユーザーが Web 上で創作するための WYSIWYG 環境を提供する目的にぴったり合った具体的なブロックを作成するために、コアが提供するさまざまなツールを一緒に構成する能力を備えるでしょう。

**カスタマイズ**。以前は複雑なマークアップを使用する必要があったため、ショートコードやメタフィールドなどを使用してユーザーがサイトを壊さないように保護していたことが、より簡単で直感的になります。ブロックを使用すると、開発者はレイアウトの一部（たとえば、フィーチャの3列グリッド）を直接レンダリングするテーマ固有のブロックを提供し、ユーザが直接編集できるものを明確に指定できます。つまり、ユーザーは WYSIWYG エクスペリエンスを得ることができるのです。壊すかもしれないと恐れる必要もなく、開発者に頼まなくてもマークアップを崩さずに簡単に文章を更新したり、画像を入れ替えたり、コラムの数を減らしたりなどするができます。

結局のところ、 Gutenberg のビジョンは、リッチなコンテンツを投稿者が簡単に作成できるようにすることです。適切なデフォルトを確保し、高度なレイアウトオプションのブロックをラップしてバンドルし、最も重要なアクションをすぐに利用できるようにすることで、誰でも WordPress でコンテンツを編集し使えるようにするべきなのです。

## インターフェイスのブループリント

基本的なエディターのインターフェイス:

![基本のインターフェイス](https://cldup.com/NDhf6ofFmq.png)

ブロックのインターフェイス:

![選択されたブロック](https://cldup.com/GlUdQnu0TR.png)

Gutenberg は上のバーと下のコンテンツの間に基本的な区切りがあります。

**editor bar(エディターバー)** は、 _ドキュメントレベル_ のアクションが配置されます。エディターモードと同様に、ステータスインジケーターの保存、取り消し/やり直し/挿入のためのグローバルアクション、設定の切り替え、最後にオプションの公開があります。

**content area(コンテンツ領域)** はドキュメントそのものが配置されます。

**settings sidebar(設定サイドバー)** はドキュメントのメタデータが配置されます。どちらもドキュメントそのもの（タグ、カテゴリ、スケジュールなど）のデータだけでなく、「ブロック」タブのブロックも対象となります。

モバイルでは、歯車ボタンをクリックするまでサイドバーは非表示になります。デスクトップでは書くことに集中するためにそれを隠すことができます。

## ブロックのインターフェイス

ブロック自体がエディターの最も基本的な単位です。全てはブロックであり、基礎である HTML マークアップの垂直なフローを模倣して構築されます。ドキュメントの各セクションを操作可能なブロックとして表示させることで、各ブロックに文脈上、固有の機能を付与できます。これはデスクトップのレイアウトアプリからを得たもので、UIに重荷を追わせることなく、高度な機能の拡張を追加するための方法です。

このブロックのインターフェイスは _基本的なアクション_ を持ちます。適切なデフォルトを保証し、最も一般的なアクションのみを使用することで、設定サイドバーを使用せずにブログを書くこと全てを完了できるようにするべきです。

ブロック自体には複数の状態があります:

- _選択されていないブロック_ は、コンテンツ自体のライブプレビューに最も近いものです。
- _選択されたブロック_ には、「クイックツールバー」が表示され、ブロックを操作する直接アクションが表示されます。特別な要素もブロックコンテンツ自体に表示されます。たとえば、画像ブロックにはキャプションフィールドが表示され、引用符には引用フィールドが表示され、ダイナミックブロックにはフォームフィールドを追加するためのボタンが表示されます。

注釈 _選択_ と _フォーカス_ は異なります。つまり、イメージブロックは選択できますがそのフォーカスはキャプションフィールドにあり、特別な（キャプション固有の）UIが表示されます。

長いブロックのページを下にスクロールすると、クイックツールバーがブロックから外れ、画面の上部に張り付きます。

## Editor Settings

If your block needs advanced configuration, those live in the Settings sidebar. Editor block settings can also be reached directly by clicking the cog icon next to a block.

The sidebar has two tabs, Document and Block:

- The "Document" tab shows metadata and settings for the post or page being edited.
- The "Block" tab shows metadata and settings for the currently selected block.

Don't put anything in the sidebar "Block" tab that is necessary for the basic operation of your block. Your user might dismiss the sidebar for an immersive writing experience. So pick good defaults, and make important actions available in the quick toolbar.

Examples of actions that could go in the "Block" tab of the sidebar could be:

- drop cap for text
- number of columns for galleries
- number of posts, or category, in the "Latest Posts" block
- any configuration that you don't _need_ access to in order to perform basic tasks

## Block Design Checklist, Do's and Don'ts, and Examples

The following is a list of blocks and which options go where. If you're developing a new block, hopefully this can help suggest where to put an option.

This is the basic recipe for a block:

- It should have a nice icon and label for the Inserter. Keep it simple.
- When you insert it, it should have a good placeholder state. If it's meant for text input, provide good placeholder text. If it's meant to hold media, have buttons for uploading or accessing media libraries, drop-zones for drag and drop, or anything else. The placeholder state will be used to make page and post templates in the future.
- Your block when unselected should preview its contents.
- Your block when selected can surface additional options, like input fields, or — if necessary for basic operation — buttons to configure the block directly.
- Every block should, at minimum, show a description in the "Block" tab of the Settings sidebar. You can access this for any block by clicking the cog next to the selected block.
- Additional block options and configuration can be added to the "Block" tab, but keep in mind a user might dismiss the sidebar and never use it, so you can't put configuration critical to the block here.

Here are a couple of block examples, describing which options go where, and why.

### Text

The most basic unit of the editor. Text is a simple input field.

Placeholder:

- Simple placeholder text that says "New Paragraph".

Selected state:

- Quick Toolbar: Has a switcher to perform transformations to headings, etc.
- Quick Toolbar: Has basic text alignments
- Quick Toolbar: Has inline formatting options, bold, italic, strikethrough and link

Editor block settings:

- Has description: "This is a simple text only block for inserting a single paragraph of content."
- Has option to enable or disable a drop-cap. Note that the drop-cap is only visible in the blocks unselected (preview) state.

_Because the drop-cap feature is not critical to the basic operation of the block, it's in the advanced sidebar, thus keeping the Quick Toolbar light-weight._

### Image

Basic image block.

Placeholder:

- A generic gray placeholder block with options to upload an image, drop an image directly on it, or pick an image from the media library. The placeholder block can be laid out as if it was an actual image, and this layout persists when a user adds an actual image into it.

Selected state:

- Quick Toolbar: Alignments, including wide and full-wide (if the theme supports it).
- Quick Toolbar: Edit Gallery (opens media library)
- Quick Toolbar: Link button
- A caption input field appears with a "Write caption..." placeholder text below the image

Editor block settings:

- Has description: "Worth a thousand words."
- Has options for changing or adding `alt` text, and adding additional custom CSS classes.

_Future improvements to the Image block could include getting rid of the media modal, in place of letting you select images directly from the placeholder itself. In general, try to avoid modals._

### Latest Posts

Placeholder:

- Has no placeholder, as it works fine upon insertion. The default inserted state shows the last 5 posts.

Selected state:

- Quick Toolbar: Alignments
- Quick Toolbar: Options for picking list view or grid view

Editor block settings:

- Has description: "Shows a list of your site's most recent posts."
- Has options for showing the post date, changing the default number of posts to show, and an option for adding an additional CSS class.

_Latest Posts is fully functional as soon as you insert it, because it comes with good defaults._

### Contact Form

Placeholder:

- Has no placeholder, as the default inserted state shows a functional contact form.

Selected state:

- Quick Toolbar: Alignments
- Shows "Remove" buttons next to fields that can be removed.
- Shows an "Add field" button, which opens a popout where you can select additional contact field options.

Editor block settings:

- Has description: "A basic contact form."
- Has options for making email address mandatory, checked by default.
- Has options for changing the form ID/name, in case you have multiple forms on a page.

_Note: this block doesn't exist in Gutenberg currently, but the above describes a "best practices" for designing such a block. Being one of the more complex blocks, it's still important that it is fully functional upon insertion, helped along by good defaults._

## Future Opportunities

Gutenberg as part of the kickoff goal is primarily limited to the confines of the _content area_ (specifically `post_content`) of posts and pages. Within those confines, we are embracing the web as a vertical river of content, by appending blocks sequentially, then adding layout options to each block.

But just like how the verticality of the web itself doesn't prevent more advanced layouts from being possible, similarly there isn't any fixed limit to the kind of layout Gutenberg will be able to accomplish. As such, it's very possible for Gutenberg to grow beyond the confines of post and page _content_, to include the whole page, including everything that surrounds the content.

One way to think of it is a theme template being just a comma separated list of blocks, like this:

```{
{
  'themename/header',
  'themename/sidebar',
  'core/content' {
    'core/cover-image',
    'themename/author-card',
    'core/text',
  },
  'themename/footer',
}
```

Every block nested inside the _content_ block would be _rearrangable_. Every block would be _editable_. Every block would be built using the same API, and both the editor and the theme would load the same `style.css` file directly. In the end you'd see the same in the editor/page builder, as you would looking at the theme/front-end itself.

*Page Templates*. Since blocks have empty states, it becomes easy to imagine theme templates being a declaration of which blocks compose a given page. These blocks would naturally guide a user to fill the information necessary to achieve what the theme promises it can deliver — it's very common that users struggle to mimic the theme demo that caught their attention. These templates could function similarly to apps like Keynote, where you can choose a specific template when creating a new page and have content blocks already laid out to help you achieve specific looks.

This concept is speculative, but it's one direction Gutenberg could go in the future.

## More resources

If you'd like to contribute, you can download a Sketch file of the Gutenberg mockups. Note that those are still mockups, and not 1:1 accurate. It is also possibole that the Sketch files aren't up-to-date with the latest Gutenberg itself, as development sometimes moves faster than our updating of the Sketch files!

**<a href="https://cloudup.com/c8Rbgsgg3nq">Download Sketch mockups & patterns files</a>**.

Be sure to also read <a href="https://wordpress.org/gutenberg/handbook/reference/faq/">the FAQ</a>, and <a href="https://wordpress.org/gutenberg/handbook/">how to build blocks</a>.
