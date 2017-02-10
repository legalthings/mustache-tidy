# Mustache Tidy

JavaScript library to clean up Mustache templates.

## Installation

    npm install mustache-tidy

## Usage

### Node.js

    var mustacheTidy = require('mustache-tidy');

    var cleanTemplate = mustacheTidy(dirtyTemplate);

`dirtyTemplate` should be a string with template html.

### Browser

    <script src="mustache-tidy.min.js"></script>

    <script>
        var cleanTemplate = mustacheTidy(dirtyTemplate);
    </script>

`dirtyTemplate` should be either a string with template html, or a root DOM Node object of template. If it is a string, result will be returned. If it is a Node object, it will be changed in place.

### Options

Second argument is also available.

```
var cleanTemplate = mustacheTidy(dirtyTemplate, options);
```

Options is an object with key/name pairs. Currently the only option available is `debug`, that should take boolean values. If set to `true`, it enables debug console output while executing tidy process.

## Why does this library exists?

When creating [mustache][] templates in a WYSIWYG HTML editor (like [CKEditor][]), you may end up with templates that
look okay, but are invalid.

> {{# foo }}
>
> Hello world
>
> {{/ foo }}

becomes

```html
<p>{{# foo }}</p>
<p>Hello world</p>
<p>{{/ foo }}</p>
```

This won't be a big issue for a real mustache implementation. But a mustache compatible template engine like [Ractive.js][] is unable to handle such a template, because it makes DOM nodes from both HTML tags and mustache tags.

When cleaned up the template becomes

```html
{{# foo }}
<p>Hello world</p>
{{/ foo }}
```

---

Look at another example. Here there might be a `sub` variable with a title and intro.

> ### Title {{# sub }}- {{ title }}
> {{ intro }}{{/sub}}

this becomes

```html
<h3>Title {{# sub }}- {{ title }}</h3>
<p>{{ intro }}{{/sub}}</p>
```

When `sub` is `null`, it's turned into invalid HTML

```html
<h3>Title</p>
```

When cleaned up the template becomes

```html
<h3>Title {{# sub }}- {{ title }}{{/ sub}}</h3>
{{# sub }}<p>{{ intro }}</p>{{/sub}}
```

So the goal of library is to fix tags sections, so that opening and closing tags of section were in the same node.

## How does it work?

Tidy process concernes only with tags sections, not with single tags.
We distinguish 2 separate cases of section positioning.

- **Single tree**. One tag is situated in a parent node of it's coupling tag:

```html
    <p>
        {{# foo }}
        <span>
            Data
            {{/ foo }}
        </span>
    </p>
```

- **Separate trees**. Tags are disconnected from each other, e.g. situated in different node trees, with common ancestor:

```html
    <p>
        <span>Data{{# foo }}</span>
        <span>Data{{/ foo }}</span>
    </p>
```

The following steps are performed for both cases, with small differences. Each tag pair is processed separately of others.

### 1. Remove tags with only section tags

HTML nodes that only contains start and/or end section tags are replaced with the inner content.

```html
<p>{{# foo }}</p>
<p>Hello world</p>
<p>{{# bar }} {{/ bar }}</p>
<p>Hi moon</p>
<p>{{/ foo }}</p>
<p>{{# bar }}Great sun{{/ bar }}</p>
```

becomes

```html
{{# foo }}
<p>Hello world</p>
{{# bar }} {{/ bar }}
<p>Hi moon</p>
{{/ foo }}
<p>{{# bar }}Great sun{{/ bar }}</p>
```

This is applyed to the following elements: `p, div, span, i, em, strong, li`.

### 2. Move section tags

If section tags are not in the same node, we move them, untill they reach common parent node. Tags are moved towards empty end of nodes. If tag reaches node, where there is some data between tag and the end of node, movement is stopped. Tag, that is further from the document root node, is considered as lower, and it's coupling tag - as upper. Lower tag is moved first.

#### 2a. Single tree case

Consider the example:

```html
    <p>
        <div>
            Data 2
            <span>
                <em>
                    {{# foo }}
                    Data 1
                </em>
            </span>
        </div>
    </p>
    {{/ foo }}
```

Here opening tag should be moved outside root `p` element to reach one level with closing tag. It can not be moved towards end of document, because there is `Data 1` text after opening tag. So we move it towards beginning of document, out of `em` node, and than out of `span` node. Then on it's way up tag meets `Data 2` text, that is not included inside tag. So opening tag can not be moved anymore, and result is:

```html
    <p>
        <div>
            Data 2
            {{# foo }}
            <span>
                <em>
                    Data 1
                </em>
            </span>
        </div>
    </p>
    {{/ foo }}
```

Now we look at the upper tag. As there is no data between it and the end of `p` tag, we can move it inside node, and position after `div` element. In the same way we can move tag inside `div` element, so the result is:

```html
    <p>
        <div>
            Data 2
            {{# foo }}
            <span>
                <em>
                    Data 1
                </em>
            </span>
            {{/ foo }}
        </div>
    </p>
```

As we reached the same level with opening tag, we have no need to move closing tag further along node chain. Tags are positioned correctly now.

#### 2b. Separate trees case

Consider the example:

```html
    <p>
        <span>
            Data 1
            {{# foo }}
        </span>
        <span>
            <em>
                Data 2
                {{/ foo }}
            </em>
        </span>
    </p>
```

Here we should move both tags to their common ancestor node, that is `p`. We always begin with opening tag. We can not move it towards `Data 1` text, so we move it towards document end, out of `span` element. Result is:

```html
    <p>
        <span>
            Data 1
        </span>
        {{# foo }}
        <span>
            <em>
                Data 2
                {{/ foo }}
            </em>
        </span>
    </p>
```

Now we move closing tag. It can not be moved towards `Data 2` text, so we move it towards document end, out of `em` element, and then out of `span` element. Result is:

```html
    <p>
        <span>
            Data 1
        </span>
        {{# foo }}
        <span>
            <em>
                Data 2
            </em>
        </span>
        {{/ foo }}
    </p>
```

Tags reached common parent element, so now they are positioned correctly.

### 3. Extend tags

Lets say that on previous step we failed to move tags to common parent. That can happen, if moving tag meets some data on its way, and stops before reaching common parent.
In this case we do *extend*: create new pairs of tags, surrounding data on each nodes level, between given opening and closing tags.

#### 3a. Single tree case

Consider the following example.

```html
    <p>
        {{# foo }}
        <span>Data</span>
        <span>Data</span>
        <div>
            <span>Data</span>
            <span>Data</span>
            <div>
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

In here we can not move closing tag up, because is has sibling elements on both sides. We also can not move opening tag down. So we extend each tag, so that data on each level was correctly enclosed in tags. We always start from lower tag, and move towards upper tag, in this case from closing tag to opening. Result is:

```html
    <p>
        {{# foo }}
        <span>Data</span>
        <span>Data</span>
        {{/ foo }}
        <div>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
            <div>
                {{# foo }}
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

#### 3b. Separate trees case

Consider the example:

```html
    <p>
        <div>
            <span>Data</span>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
        </div>
        <div>
            <span>Data</span>
            <span>Data</span>
            <div>
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

Here both tags can not be moved. So we extend them to their common ancestor element. First the upper tag is extended. Result is:

```html
    <p>
        <div>
            <span>Data</span>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
        </div>
        {{# foo }}
        <div>
            <span>Data</span>
            <span>Data</span>
            <div>
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

Then the lower is extended. Result is:

```html
    <p>
        <div>
            <span>Data</span>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
        </div>
        {{# foo }}
        {{/ foo }}
        <div>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
            <div>
                {{# foo }}
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

If we obtain an empty tag pair in common ancestor node, we remove it. So the final result is:

```html
    <p>
        <div>
            <span>Data</span>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
        </div>
        <div>
            {{# foo }}
            <span>Data</span>
            <span>Data</span>
            {{/ foo }}
            <div>
                {{# foo }}
                <span>Data</span>
                {{/ foo }}
                Data
            </div>
        </div>
    </p>
```

### 4. Fix for tables

Above steps might lead to the tags appearing in tables outside table cells, and that will break visual table structure. So we move such tags inside table cells.

```html
<table>
    <tr>
        <td>Data</td>
        {{# foo }}
        <td>Data</td>
        <td>Data</td>
        {{/ foo }}
    </tr>
    {{# foo }}
    <tr>
        <td>Data</td>
        <td>Data</td>
        <td>Data</td>
    </tr>
    {{/ foo }}
</table>
```

becomes

```html
<table>
    <tr>
        <td>Data</td>
        <td>{{# foo }}Data{{/ foo }}</td>
        <td>{{# foo }}Data{{/ foo }}</td>
    </tr>
    <tr>
        <td>{{# foo }}Data{{/ foo }}</td>
        <td>{{# foo }}Data{{/ foo }}</td>
        <td>{{# foo }}Data{{/ foo }}</td>
    </tr>
</table>
```

## Limitations

Currently the following sections structures are supported:

- positive and negative sections: `{{# foo }}{{/ foo}}` and `{{^ foo}}{{/ foo}}`
- shorthand closing tags: `{{# foo }}{{/}}`

The following sections structures are not supported:

- if/elseif/else
- using `with`
- array element sections: `{{# foo:i }}{{/ foo }}`


[mustache]: https://mustache.github.io/
[CKEditor]: http://ckeditor.com/
[Ractive.js]: http://www.ractivejs.org/
