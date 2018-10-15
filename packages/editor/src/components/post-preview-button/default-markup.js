export default `<div class="post">
    <h1 class="editor-post-title__input"></h1>
    <img class="cover-image" />
    <p></p>
    <p></p>
    <h1></h1>
    <p></p>
    <img />
    <ul>
        <li></li>
        <li></li>
        <li></li>
    </ul>
    <h1></h1>
    <p></p>
</div>
<style>
    /*
     * Variables
     */
    :root {
        --line-height: 24px;
        --line-spacing: 6px;
        --element-spacing: 42px;
        --dark-grey: #999;
        --light-grey: #ccc;
    }

    body {
        min-height: 100vh;
        background-color: #FFF;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .post {
        margin-top: var(--element-spacing);
        width: 500px;
        max-width: 100%;
        -webkit-animation: loading 1.5s infinite;
        animation: loading 1.5s infinite;
        position: relative;
    }

    .post h1 {
        background: var(--light-grey);
        width: 100%;
        height: calc(var(--line-height)*1.75);
        margin-bottom: var(--element-spacing);
        margin-top: calc(var(--element-spacing)*1.5);
    }

    .post p {
        height: calc(var(--line-height)*3 + var(--line-spacing)*2);
        width: 100%;
        background: linear-gradient(180deg, var(--light-grey) 0, var(--light-grey) var(--line-height), #fff var(--line-height), #fff calc(var(--line-height) + var(--line-spacing)), var(--light-grey) calc(var(--line-height) + var(--line-spacing)), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)), #fff calc(var(--line-height)*2 + var(--line-spacing)), #fff calc(var(--line-height)*2 + var(--line-spacing)*2), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)*2), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)*3));
        margin-bottom: var(--element-spacing);
    }

    .post img {
        display: block;
        background: var(--light-grey);
        width: 100%;
        height: 200px;
        margin-bottom: var(--element-spacing);
    }

    .post .cover-image {
        width: 120%;
        margin-left: -10%;
        margin-right: -10%;
        background-image: linear-gradient(white 0, white var(--line-height), transparent calc(40% + var(--line-height)), transparent 100%);
        background-size: 50% var(--line-height);
        background-position: center center;
        background-repeat: no-repeat;
    }

    .post ul {
        margin-bottom: var(--element-spacing);
    }

    .post li {
        background: var(--light-grey);
        width: 100%;
        height: 24px;
        margin-bottom: 10px;
        position: relative;
    }

    .post li::before {
        display: block;
        content: '';
        border-radius: 50%;
        background: var(--light-grey);
        height: 16px;
        width: 16px;
        position: absolute;
        left: -24px;
        top: 4px;
    }

    .post::after {
        display: block;
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background-image: linear-gradient(92deg, rgba(255, 255, 255, 0.2) 0, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.2) 100%);
        background-position: 0 0;
        background-size: 200% 100%;
        background-repeat: repeat-x;
        -webkit-animation: loading 1200ms linear infinite;
        animation: loading 1200ms linear infinite;
        width: 120%;
        margin-left: -10%;
        margin-right: -10%;
    }

    @-webkit-keyframes loading {
        from {
            background-position: 0 0;
        }

        to {
            background-position: -200% 0;
        }
    }

    @keyframes loading {
        from {
            background-position: 0 0;
        }

        to {
            background-position: -200% 0;
        }
    }
</style>`;
