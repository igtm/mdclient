# MDClient

Markdown Viewer Chrome Extension for Github

![image](https://user-images.githubusercontent.com/6331737/211880083-20d4dec0-17ed-446b-b490-a8640282a554.gif "image")

# Why Chrome Extension?

If you write Documentations with markdown based Document generation tool(eg. Hugo, Zola, Docusaurus),
you have to host the generated static files on somewhere.
Moreover, if your project is private, you may have to set some authentication logic (Basic ..etc)

so I take a stance in `Hostingless Documentation`.
All you have to do is just write markdown and push on Github.
if someone want to see it, just give them Github Read permission of the repo and you can see it through this extension.

# Concepts

- Hostingless Documentation Tool
- Markdown file only (Compatibility. no required configs)
- Markdown not only for Tech but also for Biz person

# Supported features

- [x] [CommonMark](https://commonmark.org/)
- [x] [github flavored markdown](https://github.github.com/gfm/)
- [x] Github Private Repository (Github OAuth App)
- [x] [mermaid.js](https://mermaid.js.org/#/)
- [x] code syntaxhighlighting with [highlightjs](https://highlightjs.org/)
- [x] Darkmode
