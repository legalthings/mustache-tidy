# Mustache Tidy

JavaScript library to clean up Mustache templates.

## Installation

    npm install mustache-tidy

## Usage

### Node.js

    var mustacheTidy = require('mustache-tidy');
    
    var cleanTemplate = mustacheTidy(dirtyTemplate);

### Browser

    <script src="mustache-tidy.min.js"></script>
    
    <script>
        var cleanTemplate = mustacheTidy(dirtyTemplate);
    </script>

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

This won't be a big issue for a real mustache implementation. But a mustache compatible template engine like
[Ractive.js][] is unable to handle such a template, because it makes DOM nodes from both HTML tags and mustache tags.

When cleaned up the template becomes

```html
{{# foo }}
<p>Hello world</p>
{{/ foo }}
```

---

Look at another the example. Here there might be a `sub` variable with a title and intro.

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

## How does it work?

Mustache tidy cleans up a template in 6 steps:

### 1. Remove tags with only section tags

All HTML nodes that only contains start and/or end section tags are with the inner content.

```html
<p>{{# foo }}</p>
<p>Hello world</p>
<p>{{/ foo }} {{^ foo }}</p>
<p>Hi moon</p>
<p>{{/ foo }}</p>
<p>{{# bar }}Great sun{{/ bar }}</p>
```

becomes

```html
{{# foo }}
<p>Hello world</p>
{{/ foo }} {{^ foo }}
<p>Hi moon</p>
{{/ foo }}
<p>{{# bar }}Great sun{{/ bar }}</p>
```

### 2. Push out unclosed section tags

We find nodes where the content starts with and end section tag or ends with a start section tag and the corresponding
tag is in the parent node. In that case we push the tag out of the node.

```html
<p>
  {{# foo }}one, two, <strong>three{{/ foo }}</strong> items <strong><em>
  {{# bar }} and more</em></strong>{{/ bar}}
</p>
```

becomes

```html
<p>
  {{# foo }}one, two, <strong>three</strong>{{/ foo }} items
  {{# bar }}<strong><em> and more</em></strong>{{/ bar}}
</p>
```

### 3. Close and reopen section tags

We identify tags that are opened but not closed within the node. They're closed at the end of the node and opened
in the next node.

```html
<p>Hello {{# foo }}world<p>
<p>How are you?{{/ foo}} I'm doing well.</p>
```

```html
<p>Hello {{# foo }}world{{/ foo}}<p>
<p>{{# foo }}How are you?{{/ foo}} I'm doing well.</p>
```

### 4. Split nodes

Next we look for sections that are opened or closed in a parent node. In that case we close the node before the section
tag and open it right after. Now one child node is outside of the mustache section and one is inside it.

```html
<p>{{# foo }}one two <strong>three{{/ foo }} four</strong> items</p>
```

becomes

```html
<p>{{# foo }}one two <strong>three</strong>{{/ foo }}<strong> four</strong> items</p>
```

**Another example:**

```html
<p>
  {{# foo }}one <em>two <strong>three{{/foo }}
  four
  {{^ foo }}zero</strong>{{/ foo}}
  items</em> here
</p>
```

becomes

```html
<p>
  {{# foo }}one <em>two <strong>three</strong></em>{{/foo }}
  <em><strong>four</strong>
  {{^ foo }}<strong>zero</strong>{{/ foo}}
  items</em> here
</p>
```

### 5. Prevent empty nodes

To prevent empty nodes caused by a section, we repeatly do two steps.

#### 5a. Move nodes inside a section

If all the content of a node is in a single section, move the complete node into the section.

```html
<p>
  {{# foo }}
    Hello
    {{# bar }}sweet{{/ bar}}
    <strong>{{# bar }}world{{/ bar }}</strong>
  {{/ foo}
</p>
```

becomes

```html
{{# foo }}
  <p>
    Hello
    {{# bar }}sweet{{/ bar}}
    {{# bar }}<strong>world</strong>{{/ bar }}
  </p>
{{/ foo}}
```

#### 5b. Merge sections

If a section is repeated, merge the two sections.

```html
{{# foo }}
  <p>
    Hello
    {{# bar }}sweet{{/ bar}}
    {{# bar }}<strong>world</strong>{{/ bar }}
  </p>
{{/ foo}}
```

becomes

```html
{{# foo }}
  <p>
    Hello
    {{# bar }}sweet <strong>world</strong>{{/ bar }}
  </p>
{{/ foo}}
```

### 6. Fix table rows

For table rows the above steps might lead to the mustache engine removing a couples of cells in a row. To overcome
this, we move the sections to be inside the cells instead.

```html
<table>
  <tr><td>blue</td>{{# foo }}<td>green</td><td>red</td>{{/ foo }}</tr>
  {{ foo }}<tr><td>ocean</td><td>grass</td><td>flower</td></tr>{{/ foo }}
</table>
```

becomes

```html
<table>
  <tr><td>blue</td><td>{{# foo }}green{{/ foo }}</td><td>{{# foo }}red{{/ foo }}</td></tr>
  {{ foo }}<tr><td>ocean</td><td>grass</td><td>flower</td></tr>{{/ foo }}
</table>
```


[mustache]: https://mustache.github.io/
[CKEditor]: http://ckeditor.com/
[Ractive.js]: http://www.ractivejs.org/
